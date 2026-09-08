package us.moneybay.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import us.moneybay.dto.ListingDto;
import us.moneybay.dto.StorefrontDto;
import us.moneybay.model.Storefront;
import us.moneybay.model.User;
import us.moneybay.repository.ListingRepository;
import us.moneybay.repository.StorefrontRepository;
import us.moneybay.service.R2PhotoService;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Витрина продавца.
 *
 * Правовые сведения — EIN, юридический адрес, банковский счёт — здесь не
 * принимаются и не хранятся. Их собирает Stripe на своей стороне: тем он и
 * снимает с площадки ответственность за утечку и за проверку по INFORM
 * Consumers Act. Сюда возвращается лишь состояние проверки.
 */
@RestController
@RequestMapping("/api/storefront")
public class StorefrontController {

    private static final org.slf4j.Logger log =
        org.slf4j.LoggerFactory.getLogger(StorefrontController.class);

    private final StorefrontRepository storefrontRepository;
    private final ListingRepository listingRepository;
    private final R2PhotoService r2PhotoService;
    private final us.moneybay.service.StripeService stripeService;

    @org.springframework.beans.factory.annotation.Value("${stripe.secret-key:}")
    private String stripeSecretKey;

    public StorefrontController(StorefrontRepository storefrontRepository,
                                ListingRepository listingRepository,
                                R2PhotoService r2PhotoService,
                                us.moneybay.service.StripeService stripeService) {
        this.storefrontRepository = storefrontRepository;
        this.listingRepository = listingRepository;
        this.r2PhotoService = r2PhotoService;
        this.stripeService = stripeService;
    }

    /**
     * Оплата тарифа витрины.
     *
     * Без настоящего ключа Stripe тариф включается сразу — так же устроено
     * продвижение объявлений. Это позволяет пройти весь путь до появления LLC
     * и учётной записи Stripe, а с ключом тот же код поведёт на оплату.
     */
    @PostMapping("/plan/checkout")
    public ResponseEntity<?> planCheckout(@RequestBody java.util.Map<String, Object> body,
                                          Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(java.util.Map.of("message", "Not authenticated"));
        User user = (User) auth.getPrincipal();

        Object planRaw = body.get("plan");
        if (planRaw == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "plan is required"));
        }
        Storefront.Plan plan;
        try {
            plan = Storefront.Plan.valueOf(planRaw.toString().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Unknown plan"));
        }

        java.util.Optional<Storefront> found = storefrontRepository.findByUserId(user.getId());
        if (found.isEmpty()) {
            return ResponseEntity.status(404).body(java.util.Map.of("message", "Storefront not found"));
        }
        Storefront store = found.get();

        // Возврат на бесплатный: платить не за что, срок снимается
        if (plan == Storefront.Plan.FREE) {
            store.setPlan(Storefront.Plan.FREE);
            store.setPlanUntil(null);
            storefrontRepository.save(store);
            log.info("event=storefront_plan_changed store_id={} plan=FREE", store.getId());
            return ResponseEntity.ok(java.util.Map.of("plan", "FREE", "dev_mode", true));
        }

        // Ключа Stripe нет: тариф ставится сразу на месяц, платежа не было
        if (stripeSecretKey == null || stripeSecretKey.isBlank() || stripeSecretKey.contains("dummy")) {
            store.setPlan(plan);
            store.setPlanUntil(java.time.Instant.now().plus(30, java.time.temporal.ChronoUnit.DAYS));
            storefrontRepository.save(store);
            log.info("event=storefront_plan_activated store_id={} plan={} mode=dev", store.getId(), plan);
            return ResponseEntity.ok(java.util.Map.of(
                "checkout_url", "/storefront?plan=" + plan.name().toLowerCase(),
                "plan", plan.name(),
                "dev_mode", true));
        }

        try {
            String url = stripeService.createStorefrontPlanCheckout(
                plan.name(), plan.priceCents, user.getId());
            return ResponseEntity.ok(java.util.Map.of("checkout_url", url, "dev_mode", false));
        } catch (Exception e) {
            log.error("event=storefront_plan_checkout_failed store_id={} plan={} error={}",
                      store.getId(), plan, e.getMessage());
            return ResponseEntity.status(502).body(java.util.Map.of("message", "Payment service unavailable"));
        }
    }

    /** Витрина текущего пользователя; пусто, если не заведена. */
    @GetMapping("/mine")
    public ResponseEntity<?> mine(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        User user = (User) auth.getPrincipal();
        return storefrontRepository.findByUserId(user.getId())
            .map(s -> ResponseEntity.ok((Object) StorefrontDto.from(s)))
            .orElse(ResponseEntity.ok(null));
    }

    /** Заведение витрины. Имя обязательно, адрес выводится из него. */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, String> body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        User user = (User) auth.getPrincipal();

        if (storefrontRepository.findByUserId(user.getId()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Storefront already exists"));
        }

        String name = body.getOrDefault("name", "").trim();
        if (name.length() < 3) {
            return ResponseEntity.badRequest().body(Map.of("message", "Store name is too short"));
        }

        Storefront s = new Storefront();
        s.setUser(user);
        s.setName(name);
        s.setSlug(uniqueSlug(name));
        s.setLocation(user.getCity());
        return ResponseEntity.ok(StorefrontDto.from(storefrontRepository.save(s)));
    }

    /** Правка витрины: только то, что видят покупатели. */
    @PutMapping
    public ResponseEntity<?> update(@RequestBody Map<String, Object> body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        User user = (User) auth.getPrincipal();

        return storefrontRepository.findByUserId(user.getId())
            .map(s -> {
                if (body.containsKey("name")) s.setName(str(body.get("name")));
                if (body.containsKey("about")) s.setAbout(str(body.get("about")));
                if (body.containsKey("location")) s.setLocation(str(body.get("location")));
                if (body.containsKey("phones")) s.setPhones(str(body.get("phones")));
                if (body.containsKey("website")) s.setWebsite(str(body.get("website")));
                if (body.containsKey("hours")) s.setHours(str(body.get("hours")));
                if (body.containsKey("published")) {
                    s.setPublished(Boolean.TRUE.equals(body.get("published")));
                }
                return ResponseEntity.ok((Object) StorefrontDto.from(storefrontRepository.save(s)));
            })
            .orElse(ResponseEntity.status(404).body(Map.of("message", "No storefront")));
    }

    /**
     * Логотип или обложка. Тип задаётся в пути: logo или banner.
     *
     * Это изображения магазина, а не личное фото, поэтому загрузка со своего
     * устройства здесь уместна: витрину оформляет владелец.
     */
    @PostMapping("/image/{kind}")
    public ResponseEntity<?> uploadImage(@PathVariable String kind,
                                         @RequestParam("file") MultipartFile file,
                                         Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        if (!kind.equals("logo") && !kind.equals("banner")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Unknown image kind"));
        }
        if (file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "File is empty"));
        if (file.getSize() > 3_000_000) {
            return ResponseEntity.badRequest().body(Map.of("message", "Image must be under 3 MB"));
        }

        String type = file.getContentType();
        if (type == null || !(type.equals("image/jpeg") || type.equals("image/png")
                || type.equals("image/webp"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Allowed: JPEG, PNG, WebP"));
        }

        User user = (User) auth.getPrincipal();
        return storefrontRepository.findByUserId(user.getId())
            .map(s -> {
                try {
                    String url = r2PhotoService.uploadPhoto(file);
                    if (kind.equals("logo")) s.setLogoUrl(url); else s.setBannerUrl(url);
                    return ResponseEntity.ok((Object) StorefrontDto.from(storefrontRepository.save(s)));
                } catch (IOException e) {
                    return ResponseEntity.status(500).body(Map.of("message", "Failed to upload image"));
                }
            })
            .orElse(ResponseEntity.status(404).body(Map.of("message", "No storefront")));
    }

    /**
     * Открытая страница магазина: витрина и объявления продавца.
     * Неопубликованная не отдаётся.
     */
    @GetMapping("/{slug}")
    public ResponseEntity<?> publicView(@PathVariable String slug) {
        return storefrontRepository.findBySlug(slug)
            .filter(Storefront::isPublished)
            .map(s -> {
                List<ListingDto> listings = listingRepository
                    .findActiveByUser(s.getUser().getId(), PageRequest.of(0, 48))
                    .stream().map(ListingDto::from).toList();

                Map<String, Object> response = new java.util.HashMap<>();
                response.put("storefront", StorefrontDto.from(s));
                response.put("listings", listings);
                response.put("listings_count", listingRepository.countActiveByUser(s.getUser().getId()));
                return ResponseEntity.ok((Object) response);
            })
            .orElse(ResponseEntity.status(404).body(Map.of("message", "Storefront not found")));
    }

    /** Имя латиницей и цифрами, с числом на конце при совпадении. */
    private String uniqueSlug(String name) {
        String base = name.toLowerCase(Locale.US)
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("(^-|-$)", "");
        if (base.isEmpty()) base = "store";

        String slug = base;
        int n = 2;
        while (storefrontRepository.existsBySlug(slug)) {
            slug = base + "-" + n++;
        }
        return slug;
    }

    private static String str(Object value) {
        return value == null ? null : value.toString();
    }
}
