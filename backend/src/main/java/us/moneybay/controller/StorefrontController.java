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

    private final StorefrontRepository storefrontRepository;
    private final ListingRepository listingRepository;
    private final R2PhotoService r2PhotoService;

    public StorefrontController(StorefrontRepository storefrontRepository,
                                ListingRepository listingRepository,
                                R2PhotoService r2PhotoService) {
        this.storefrontRepository = storefrontRepository;
        this.listingRepository = listingRepository;
        this.r2PhotoService = r2PhotoService;
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
