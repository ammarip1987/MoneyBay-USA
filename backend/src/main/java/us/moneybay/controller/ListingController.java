package us.moneybay.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import us.moneybay.config.CityContext;
import us.moneybay.dto.ListingDto;
import us.moneybay.model.City;
import us.moneybay.model.Listing;
import us.moneybay.model.User;
import us.moneybay.repository.CategoryRepository;
import us.moneybay.repository.CityRepository;
import us.moneybay.repository.ListingRepository;
import us.moneybay.service.R2PhotoService;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    /** Объявлений на странице: сетка выводит по пять в ряд, выходит 12 рядов. */
    private static final int PAGE_SIZE = 60;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    private final ListingRepository listingRepository;
    private final CategoryRepository categoryRepository;
    private final CityRepository cityRepository;

    @Autowired
    private R2PhotoService r2PhotoService;

    @Autowired
    private us.moneybay.service.KeywordFilterService keywordFilterService;
    @org.springframework.beans.factory.annotation.Autowired
    private us.moneybay.service.ListingReviewService listingReviewService;

    public ListingController(ListingRepository listingRepository,
                             CategoryRepository categoryRepository,
                             CityRepository cityRepository) {
        this.listingRepository = listingRepository;
        this.categoryRepository = categoryRepository;
        this.cityRepository = cityRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> list(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String city,
        @RequestParam(required = false) String category,
        @RequestParam(defaultValue = "newest") String sort,
        @RequestParam(name = "price_min", required = false) Double priceMin,
        @RequestParam(name = "price_max", required = false) Double priceMax,
        @RequestParam(name = "has_image", defaultValue = "false") boolean hasImage,
        @RequestParam(name = "posted_within", required = false) Integer postedWithinDays) {

        // Только выбранная сортировка — под неё есть индексы. Продвинутые
        // выносятся вперёд отдельным запросом ниже: добавь их сюда, и порядок
        // перестанет ложиться на индекс, а база начнёт перебирать всю таблицу.
        Sort sortObj = switch (sort) {
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "price");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "price");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };

        city = resolveCity(city);

        java.time.Instant postedAfter = null;
        if (postedWithinDays != null && postedWithinDays > 0) {
            postedAfter = java.time.Instant.now().minus(postedWithinDays, java.time.temporal.ChronoUnit.DAYS);
        }

        if (page < 1) page = 1;
        // 16 на страницу: ровно ложится в сетку по четыре карточки в ряд
        PageRequest pageRequest = PageRequest.of(page - 1, PAGE_SIZE, sortObj);
        boolean advancedFilters = priceMin != null || priceMax != null || hasImage || postedAfter != null;

        Map<String, Object> response = new HashMap<>();
        response.put("page", page);
        response.put("page_size", PAGE_SIZE);

        if (advancedFilters) {
            // С расширенными фильтрами выборка узкая: и подсчёт, и вынос
            // продвинутых по promotedUntil обходятся дёшево
            PageRequest filtered = PageRequest.of(page - 1, PAGE_SIZE,
                Sort.by(Sort.Order.desc("promotedUntil").nullsLast()).and(sortObj));
            Page<Listing> listings = listingRepository.searchAdvanced(
                q, city, category, priceMin, priceMax, hasImage, postedAfter, filtered);
            response.put("listings", listings.getContent().stream().map(ListingDto::from).toList());
            response.put("total", listings.getTotalElements());
            response.put("has_next", listings.hasNext());
            response.put("total_pages", listings.getTotalPages());
            return ResponseEntity.ok(response);
        }

        // Без фильтров подсчёт всех строк читал бы таблицу целиком: на миллионах
        // записей это секунды, и запросы накапливались, забивая диск. Берём на
        // одну запись больше нужного — её наличие и означает следующую страницу.
        PageRequest slice = PageRequest.of(page - 1, PAGE_SIZE + 1, sortObj);
        List<Listing> rows = listingRepository.searchSlice(q, city, category, slice);

        boolean hasNext = rows.size() > PAGE_SIZE;
        if (hasNext) rows = rows.subList(0, PAGE_SIZE);

        // Продвинутые выносятся вперёд только на первой странице и отдельным
        // запросом: сортировка по сроку продвижения в общей выборке не ложится
        // на индекс, и база перебирала сотни тысяч строк.
        if (page == 1 && (q == null || q.isBlank())) {
            List<Listing> promoted = listingRepository.findPromoted(
                city, category, PageRequest.of(0, 6));
            if (!promoted.isEmpty()) {
                Set<Long> ids = promoted.stream().map(Listing::getId).collect(Collectors.toSet());
                List<Listing> merged = new ArrayList<>(promoted);
                rows.stream().filter(l -> !ids.contains(l.getId())).forEach(merged::add);
                rows = merged.size() > PAGE_SIZE ? merged.subList(0, PAGE_SIZE) : merged;
            }
        }

        response.put("listings", rows.stream().map(ListingDto::from).toList());
        response.put("has_next", hasNext);
        // Точного числа страниц нет — карусель показывает соседние и следующую,
        // пока та существует. Подсчёт миллионов строк для этого не стоит.
        response.put("total_pages", hasNext ? page + 1 : page);
        response.put("total", -1);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/facets")
    public ResponseEntity<Map<String, Object>> facets(
        @RequestParam(required = false) String city,
        @RequestParam(required = false) String category) {

        city = resolveCity(city);

        // Считает база: границы и среднее одним запросом, распределение —
        // вторым. Прежде все цены выбирались в приложение и обрабатывались там,
        // и на большой категории это занимало больше двух секунд.
        Object[] stats = listingRepository.priceStats(city, category);
        Map<String, Object> response = new HashMap<>();

        long total = stats[0] == null ? 0 : ((Number) stats[0]).longValue();
        response.put("total", total);

        if (total == 0 || stats[1] == null) {
            response.put("price_min", 0);
            response.put("price_max", 0);
            response.put("price_avg", 0);
            response.put("price_buckets", List.of());
            return ResponseEntity.ok(response);
        }

        double min = ((Number) stats[1]).doubleValue();
        double max = ((Number) stats[2]).doubleValue();
        double avg = ((Number) stats[3]).doubleValue();

        final int bucketCount = 12;
        // Все цены одинаковы: одна корзина на всё, width_bucket на нулевом
        // размахе разложить не сможет
        double span = max - min;
        List<Map<String, Object>> buckets = new java.util.ArrayList<>();

        if (span <= 0) {
            Map<String, Object> single = new HashMap<>();
            single.put("min", round(min));
            single.put("max", round(max));
            single.put("count", total);
            buckets.add(single);
        } else {
            Map<Integer, Long> counts = new HashMap<>();
            for (Object[] row : listingRepository.priceBuckets(city, category, min, max, bucketCount)) {
                counts.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
            }

            double bucketSize = span / bucketCount;
            for (int i = 0; i < bucketCount; i++) {
                double bMin = min + (i * bucketSize);
                double bMax = (i == bucketCount - 1) ? max : (bMin + bucketSize);
                // width_bucket нумерует с единицы; всё, что равно max, попадает
                // в корзину bucketCount + 1 — присоединяем её к последней
                long count = counts.getOrDefault(i + 1, 0L);
                if (i == bucketCount - 1) count += counts.getOrDefault(bucketCount + 1, 0L);

                Map<String, Object> bucket = new HashMap<>();
                bucket.put("min", round(bMin));
                bucket.put("max", round(bMax));
                bucket.put("count", count);
                buckets.add(bucket);
            }
        }

        response.put("price_min", round(min));
        response.put("price_max", round(max));
        response.put("price_avg", round(avg));
        response.put("price_buckets", buckets);
        return ResponseEntity.ok(response);
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    // Пустой city -> город из city-subdomain (единая точка для list/facets/suggest)
    private String resolveCity(String city) {
        if (city != null && !city.isBlank()) return city;
        String subdomain = CityContext.getSubdomain();
        if (subdomain != null) {
            Optional<City> match = cityRepository.findBySubdomain(subdomain);
            if (match.isPresent()) return match.get().getName();
        }
        return city;
    }

    @GetMapping("/suggest")
    public ResponseEntity<List<Map<String, Object>>> suggest(
        @RequestParam(name = "q") String q,
        @RequestParam(required = false) String city,
        @RequestParam(defaultValue = "8") int limit) {

        if (q == null || q.trim().length() < 2) {
            return ResponseEntity.ok(List.of());
        }

        String query = q.trim();
        if (limit > 20) limit = 20;
        if (limit < 1) limit = 1;

        city = resolveCity(city);

        org.springframework.data.domain.PageRequest pageReq = org.springframework.data.domain.PageRequest.of(0, limit);
        List<Listing> matches = listingRepository.suggestByTitlePrefix(query, city, pageReq);

        if (matches.size() < limit) {
            List<Listing> more = listingRepository.suggestByTitleContains(query, city, pageReq);
            for (Listing m : more) {
                if (matches.stream().noneMatch(x -> x.getId().equals(m.getId()))) {
                    matches.add(m);
                    if (matches.size() >= limit) break;
                }
            }
        }

        List<Map<String, Object>> response = matches.stream().map(l -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", l.getId());
            item.put("title", l.getTitle());
            item.put("price", l.getPrice());
            item.put("location", l.getLocation());
            item.put("image", l.getImages() != null && !l.getImages().isEmpty() ? l.getImages().get(0) : null);
            return item;
        }).toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        return listingRepository.findById(id)
            .map(listing -> {
                listing.setViews(listing.getViews() + 1);
                listingRepository.save(listing);
                return ResponseEntity.ok((Object) ListingDto.from(listing));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/similar")
    public ResponseEntity<Map<String, List<ListingDto>>> similar(@PathVariable Long id) {
        Optional<Listing> opt = listingRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        Listing listing = opt.get();
        Long categoryId = listing.getCategory() != null ? listing.getCategory().getId() : null;
        Long userId = listing.getUser() != null ? listing.getUser().getId() : null;
        Double price = listing.getPrice();
        String location = listing.getLocation();

        List<Listing> sameLocation = listingRepository.findRelatedSameLocation(id, categoryId, location);
        List<Listing> similarPrice = listingRepository.findRelatedSimilarPrice(id, categoryId, price * 0.8, price * 1.2);
        List<Listing> fromSeller = listingRepository.findRelatedFromSeller(id, categoryId, userId);

        Map<String, List<ListingDto>> response = new HashMap<>();
        response.put("same_location", sameLocation.stream().map(ListingDto::from).toList());
        response.put("similar_price", similarPrice.stream().map(ListingDto::from).toList());
        response.put("from_seller", fromSeller.stream().map(ListingDto::from).toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<?> create(
        @RequestParam String title,
        @RequestParam String description,
        @RequestParam Double price,
        @RequestParam String location,
        @RequestParam(required = false) String area,
        @RequestParam(name = "category_id", required = false) Long categoryId,
        @RequestParam(value = "images", required = false) MultipartFile[] images,
        Authentication auth) {

        if (auth == null) return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        User user = (User) auth.getPrincipal();

        Listing listing = new Listing();
        listing.setTitle(title);
        listing.setDescription(description);
        listing.setPrice(price);
        listing.setLocation(location);
        listing.setArea(area);
        listing.setUser(user);

        if (categoryId != null) {
            categoryRepository.findById(categoryId).ifPresent(listing::setCategory);
        }

        if (images != null && images.length > 0) {
            listing.setImages(saveImages(images));
        }

        applyKeywordModeration(listing);
        applyReview(listing);
        return ResponseEntity.ok(ListingDto.from(listingRepository.save(listing)));
    }

    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<?> update(
        @PathVariable Long id,
        @RequestParam(required = false) String title,
        @RequestParam(required = false) String description,
        @RequestParam(required = false) Double price,
        @RequestParam(required = false) String location,
        @RequestParam(required = false) String area,
        @RequestParam(value = "removed_images", required = false) String[] removedImages,
        @RequestParam(value = "images", required = false) MultipartFile[] newImages,
        Authentication auth) {

        if (auth == null) return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        User user = (User) auth.getPrincipal();

        Optional<Listing> listingOpt = listingRepository.findById(id);
        if (listingOpt.isEmpty() || !listingOpt.get().getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Not allowed"));
        }

        Listing listing = listingOpt.get();
        if (title != null) listing.setTitle(title);
        if (description != null) listing.setDescription(description);
        if (price != null) listing.setPrice(price);
        if (location != null) listing.setLocation(location);
        if (area != null) listing.setArea(area);

        if (removedImages != null) {
            List<String> remaining = new ArrayList<>(listing.getImages());
            remaining.removeAll(Arrays.asList(removedImages));
            listing.setImages(remaining);
            // TODO: delete actual files from disk
        }

        if (newImages != null && newImages.length > 0) {
            List<String> all = new ArrayList<>(listing.getImages());
            all.addAll(saveImages(newImages));
            listing.setImages(all);
        }

        applyKeywordModeration(listing);
        applyReview(listing);
        return ResponseEntity.ok(ListingDto.from(listingRepository.save(listing)));
    }

    // severity 2 -> hide, severity 3 -> ban (CLAUDE.md, Trust & Safety)
    /**
     * Проверка при публикации. Объявление с замечаниями не удаляется — оно
     * остаётся у автора, показывается окно с перечнем недочётов, и после правки
     * проверка проходит заново.
     */
    private void applyReview(Listing listing) {
        // Забаненное фильтром слов не перепроверяем: причина там серьёзнее
        if (listing.getStatus() == Listing.ListingStatus.BANNED) return;

        List<String> reasons = listingReviewService.review(listing);
        listing.setModerationReasons(reasons.isEmpty() ? null : String.join(",", reasons));

        if (listingReviewService.shouldReject(reasons)) {
            listing.setStatus(Listing.ListingStatus.REJECTED);
            listing.setActive(false);
        } else if (listing.getStatus() == Listing.ListingStatus.REJECTED) {
            // Недочёты исправлены — объявление снова показывается
            listing.setStatus(Listing.ListingStatus.ACTIVE);
            listing.setActive(true);
        }
    }

    private void applyKeywordModeration(Listing listing) {
        var result = keywordFilterService.checkContent(
            listing.getTitle() == null ? "" : listing.getTitle(),
            listing.getDescription() == null ? "" : listing.getDescription());
        if (!result.matched) return;
        if (result.severity >= 3) {
            listing.setStatus(Listing.ListingStatus.BANNED);
            listing.setActive(false);
        } else if (result.severity == 2) {
            listing.setStatus(Listing.ListingStatus.HIDDEN);
            listing.setActive(false);
            listing.setAutoHidden(true);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        User user = (User) auth.getPrincipal();

        return listingRepository.findById(id)
            .filter(l -> l.getUser().getId().equals(user.getId()) || user.isAdmin())
            .map(l -> {
                l.setDeleted(true);
                l.setDeletedAt(java.time.Instant.now());
                l.setActive(false);
                listingRepository.save(l);
                return ResponseEntity.ok(Map.of("success", true, "soft_delete", true));
            })
            .orElse(ResponseEntity.status(403).body(Map.of("success", false)));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<?> restore(@PathVariable Long id, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        User user = (User) auth.getPrincipal();
        if (!user.isAdmin()) return ResponseEntity.status(403).body(Map.of("message", "Admin required"));

        return listingRepository.findById(id)
            .map(l -> {
                l.setDeleted(false);
                l.setDeletedAt(null);
                l.setActive(true);
                listingRepository.save(l);
                return ResponseEntity.ok(Map.of("success", true, "restored", true));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    private List<String> saveImages(MultipartFile[] files) {
        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;
            try {
                String url = r2PhotoService.uploadPhoto(file);
                urls.add(url);
            } catch (IOException e) {
                throw new RuntimeException("Failed to upload image to R2", e);
            }
        }
        return urls;
    }
}
