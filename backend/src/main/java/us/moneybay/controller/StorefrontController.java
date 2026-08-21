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

    public StorefrontController(StorefrontRepository storefrontRepository,
                                ListingRepository listingRepository) {
        this.storefrontRepository = storefrontRepository;
        this.listingRepository = listingRepository;
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
