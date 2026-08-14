package us.moneybay.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import us.moneybay.dto.ListingDto;
import us.moneybay.model.*;
import us.moneybay.repository.*;

import java.util.*;

@RestController
@RequestMapping("/api/test")
public class TestDataController {

    private static final int MAX_SEED_COUNT = 10_000;
    private static final int BATCH_SIZE = 500;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/create-listings")
    public ResponseEntity<?> createTestListings(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        User user = (User) auth.getPrincipal();
        List<Category> categories = categoryRepository.findAll();
        List<City> cities = cityRepository.findAll();

        if (categories.isEmpty() || cities.isEmpty()) {
            return ResponseEntity.badRequest().body("No categories or cities found");
        }

        List<ListingDto> created = new ArrayList<>();

        String[] titles = {
            "iPhone 14 Pro - Excellent condition",
            "Mountain bike Trek X-Caliber",
            "Vintage wooden table",
            "Gaming PC RTX 4070",
            "Apartment for rent - Downtown"
        };

        String[] descriptions = {
            "Barely used iPhone 14 Pro, 256GB. Comes with original box and accessories. No scratches.",
            "Trek X-Caliber mountain bike, 27.5 inch wheels, excellent for trails. Well maintained.",
            "Beautiful vintage wooden table from the 1970s. Great condition. Perfect for dining room.",
            "High-end gaming PC with RTX 4070, Intel i7, 32GB RAM. Perfect for gaming and streaming.",
            "2BR/2BA apartment in downtown, close to metro, parking included. Pet friendly."
        };

        double[] prices = {800, 450, 250, 1500, 2000};

        for (int i = 0; i < 5; i++) {
            Listing listing = new Listing();
            listing.setTitle(titles[i]);
            listing.setDescription(descriptions[i]);
            listing.setPrice(prices[i]);
            listing.setLocation(cities.get(i % cities.size()).getName());
            listing.setUser(user);
            listing.setCategory(categories.get(i % categories.size()));
            listing.setTest(true);

            listing.setImages(List.of());

            Listing saved = listingRepository.save(listing);
            created.add(ListingDto.from(saved));
        }

        return ResponseEntity.ok(Map.of(
            "message", "5 test listings created successfully",
            "count", created.size(),
            "listings", created
        ));
    }

    /**
     * Mass-seed test listings marked with is_test = true.
     * POST /api/test/seed-listings?count=5000
     */
    @PostMapping("/seed-listings")
    public ResponseEntity<?> seedTestListings(
            @RequestParam(defaultValue = "5000") int count,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        if (count < 1 || count > MAX_SEED_COUNT) {
            return ResponseEntity.badRequest().body("count must be between 1 and " + MAX_SEED_COUNT);
        }

        User user = (User) auth.getPrincipal();
        List<Category> categories = categoryRepository.findAll();
        List<City> cities = cityRepository.findAll();

        if (categories.isEmpty() || cities.isEmpty()) {
            return ResponseEntity.badRequest().body("No categories or cities found");
        }

        String[] items = {
            "iPhone 14 Pro", "Samsung Galaxy S23", "MacBook Air M2", "Gaming PC RTX 4070",
            "Sony PlayStation 5", "Mountain bike Trek X-Caliber", "Road bike Giant Contend",
            "Vintage wooden table", "Leather sofa 3-seater", "IKEA wardrobe PAX",
            "Honda Civic 2019", "Toyota Camry 2018", "Ford F-150 2020", "Tesla Model 3 2021",
            "2BR apartment downtown", "Studio near metro", "3BR house with garage",
            "Dewalt cordless drill", "Bosch washing machine", "Dyson V11 vacuum",
            "Canon EOS R6 camera", "GoPro Hero 12", "DJI Mini 3 drone",
            "Nike Air Max 90", "Levi's 501 jeans", "North Face jacket",
            "Baby stroller Bugaboo", "Lego Technic set", "Yamaha acoustic guitar",
            "Xbox Series X", "LG 55\" OLED TV", "Kindle Paperwhite"
        };
        String[] conditions = {
            "like new", "excellent condition", "good condition", "barely used",
            "mint condition", "used, works perfectly", "new in box", "great shape"
        };
        String[] extras = {
            "Original box included.", "Selling due to moving.", "Price is firm.",
            "Can deliver locally.", "Cash only, pickup.", "Recently serviced.",
            "First come, first served.", "No trades please.", "Warranty remaining.",
            "Message me for more photos."
        };

        Random rnd = new Random(42);
        long seedRunId = System.currentTimeMillis();
        int created = 0;

        while (created < count) {
            int batchTarget = Math.min(BATCH_SIZE, count - created);
            List<Listing> batch = new ArrayList<>(batchTarget);

            for (int i = 0; i < batchTarget; i++) {
                int n = created + i + 1;
                Listing listing = new Listing();

                String item = items[rnd.nextInt(items.length)];
                String condition = conditions[rnd.nextInt(conditions.length)];
                listing.setTitle(item + " - " + condition + " #" + n);

                listing.setDescription(
                    item + " in " + condition + ". " + extras[rnd.nextInt(extras.length)]
                    + " [test data, run " + seedRunId + ", #" + n + "]"
                );

                double price = 5 + (rnd.nextInt(20000) / 10.0); // $5 .. $2005
                listing.setPrice(Math.round(price * 100.0) / 100.0);

                listing.setLocation(cities.get(rnd.nextInt(cities.size())).getName());
                listing.setCategory(categories.get(rnd.nextInt(categories.size())));
                listing.setUser(user);
                listing.setViews(rnd.nextInt(500));
                listing.setImages(List.of());
                listing.setTest(true);

                batch.add(listing);
            }

            listingRepository.saveAll(batch);
            created += batchTarget;
        }

        return ResponseEntity.ok(Map.of(
            "message", "Test listings created successfully",
            "requested", count,
            "created", created,
            "isTest", true,
            "totalTestListings", listingRepository.countByIsTestTrue()
        ));
    }

    /**
     * Count test listings (is_test = true).
     * GET /api/test/count-test-listings
     */
    @GetMapping("/count-test-listings")
    public ResponseEntity<?> countTestListings() {
        return ResponseEntity.ok(Map.of(
            "testListings", listingRepository.countByIsTestTrue(),
            "totalListings", listingRepository.count()
        ));
    }

    /**
     * Hard-delete ONLY test listings (is_test = true). Real listings are untouched.
     * DELETE /api/test/purge-test-listings
     */
    @DeleteMapping("/purge-test-listings")
    public ResponseEntity<?> purgeTestListings(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        int deleted = listingRepository.deleteAllByIsTestTrue();
        return ResponseEntity.ok(Map.of(
            "message", "Test listings deleted (is_test = true only)",
            "deleted", deleted,
            "remainingListings", listingRepository.count()
        ));
    }

}
