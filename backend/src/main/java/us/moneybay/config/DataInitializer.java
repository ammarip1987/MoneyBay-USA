package us.moneybay.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import us.moneybay.model.Category;
import us.moneybay.model.City;
import us.moneybay.model.Subcategory;
import us.moneybay.repository.CategoryRepository;
import us.moneybay.repository.CityRepository;
import us.moneybay.repository.SubcategoryRepository;
import java.util.List;
import java.util.Optional;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private final CategoryRepository categoryRepository;
    private final CityRepository cityRepository;
    private final SubcategoryRepository subcategoryRepository;
    private final us.moneybay.repository.ListingRepository listingRepository;
    private final us.moneybay.service.KeywordFilterService keywordFilterService;

    public DataInitializer(CategoryRepository categoryRepository,
                           CityRepository cityRepository,
                           SubcategoryRepository subcategoryRepository,
                           us.moneybay.repository.ListingRepository listingRepository,
                           us.moneybay.service.KeywordFilterService keywordFilterService) {
        this.categoryRepository = categoryRepository;
        this.cityRepository = cityRepository;
        this.subcategoryRepository = subcategoryRepository;
        this.listingRepository = listingRepository;
        this.keywordFilterService = keywordFilterService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        log.info("DataInitializer started");
        upsertCategories();
        retireHousingCategory();
        syncCities();
        log.info("Cities synced, count: {}", cityRepository.count());
        // Пересборка при расхождении с сидом. Порог был "меньше 75" и не срабатывал
        // при добавлении записей: справочник молча оставался прежним
        long expected = SUB_DEFS.size() + SUB_SUB_DEFS.size();
        long actual = subcategoryRepository.count();
        if (actual != expected) {
            log.info("Subcategories: {} in database, {} in seed — rebuilding", actual, expected);
            // Сначала третий уровень: строки ссылаются на родителя через parent_id,
            // и пакетное удаление одним запросом упирается во внешний ключ.
            // flush обязателен — иначе вставки уходят раньше удалений и падают
            // на уникальности пары (category_id, slug)
            subcategoryRepository.deleteAllByParentIsNotNull();
            subcategoryRepository.flush();
            subcategoryRepository.deleteAllInBatch();
            subcategoryRepository.flush();
            initAllSubcategories();
        }
        keywordFilterService.initializeDefaultKeywords();
    }

    private record CatDef(String slug, String name, String description, String icon, String color) {}
    private record SubDef(String parentSlug, String slug, String name, String icon, String color, String desc) {}
    private record SubSubDef(String categorySlug, String parentSubSlug, String slug, String name, String icon, String color, String desc) {}

    private void upsertCategories() {
        List<CatDef> cats = List.of(
            new CatDef("kids-baby", "Kids & Baby", "Baby gear, toys, clothing and more", "<i class=\"fas fa-child\"></i>", "#FFE5E5"),
            new CatDef("realestate", "Real Estate", "Buy, sell, rent property & accommodation", "<i class=\"fas fa-building\"></i>", "#E5F0FF"),
            new CatDef("auto", "Vehicles", "Cars, trucks and motorcycles", "<i class=\"fas fa-car\"></i>", "#E5FFE5"),
            new CatDef("jobs", "Jobs", "Job listings and resumes", "<i class=\"fas fa-briefcase\"></i>", "#F0E5FF"),
            new CatDef("animals", "Pets", "Animals, pet supplies and services", "<i class=\"fas fa-paw\"></i>", "#FFE5F0"),
            new CatDef("electronics", "Electronics", "Phones, computers and gadgets", "<i class=\"fas fa-mobile-alt\"></i>", "#E5F5FF"),
            new CatDef("clothes", "Fashion", "Clothing, shoes and accessories", "<i class=\"fas fa-tshirt\"></i>", "#FFE5E5"),
            new CatDef("food", "Food & Grocery", "Food, drinks and specialty items", "<i class=\"fas fa-shopping-cart\"></i>", "#FFF9E5"),
            new CatDef("cosmetics", "Beauty & Cosmetics", "Skincare and beauty products", "<i class=\"fas fa-spa\"></i>", "#FCE4EC"),
            new CatDef("business", "Business & Services", "Business equipment and professional services", "<i class=\"fas fa-handshake\"></i>", "#E5FFF5"),
            new CatDef("hobby", "Hobbies & Sports", "Sports gear, tickets and collectibles", "<i class=\"fas fa-football-ball\"></i>", "#E5E5FF"),
            new CatDef("home", "Home & Garden", "Furniture, appliances and garden", "<i class=\"fas fa-home\"></i>", "#E5FFE5")
        );

        for (CatDef c : cats) {
            Category cat = categoryRepository.findBySlug(c.slug()).orElseGet(Category::new);
            cat.setSlug(c.slug());
            cat.setName(c.name());
            cat.setDescription(c.description());
            cat.setIcon(c.icon());
            cat.setColor(c.color());
            categoryRepository.save(cat);
        }
    }

    /**
     * Housing упразднена, её содержимое перешло в Real Estate. Объявления
     * переводятся до удаления категории: иначе внешний ключ не даст её удалить,
     * а при каскаде они пропали бы вместе с ней.
     *
     * У объявления есть только category_id, привязки к подкатегории в модели
     * нет — назначить конкретную ветку аренды поэтому невозможно, владелец
     * выберет её при следующей правке объявления.
     */
    private void retireHousingCategory() {
        Optional<Category> housing = categoryRepository.findBySlug("rental");
        if (housing.isEmpty()) return;

        Optional<Category> realEstate = categoryRepository.findBySlug("realestate");
        if (realEstate.isEmpty()) {
            log.warn("Housing kept: realestate category is missing, nothing to move listings to");
            return;
        }

        int moved = listingRepository.moveToCategory(housing.get().getId(), realEstate.get().getId());
        subcategoryRepository.deleteByCategoryId(housing.get().getId());
        categoryRepository.delete(housing.get());
        log.info("Housing retired: {} listings moved to Real Estate", moved);
    }

    private void initAllSubcategories() {
        buildSubcategories(SUB_DEFS, SUB_SUB_DEFS);
    }

    // Subcategories (level 2)
    private static final List<SubDef> SUB_DEFS = List.of(
            // Vehicles
            new SubDef("auto", "cars-trucks", "Cars & Trucks", "<i class=\"fa-solid fa-car\"></i>", "#E3F2FD", "New and used cars, trucks, SUVs and vans"),
            new SubDef("auto", "motorcycles", "Motorcycles", "<i class=\"fa-solid fa-motorcycle\"></i>", "#FFF3E0", "Motorcycles, scooters and mopeds"),
            new SubDef("auto", "rvs-campers", "RVs & Campers", "<i class=\"fa-solid fa-caravan\"></i>", "#E8F5E9", "Motorhomes, travel trailers and camper vans"),
            new SubDef("auto", "boats", "Boats & Watercraft", "<i class=\"fa-solid fa-sailboat\"></i>", "#E1F5FE", "Boats, jet skis and other watercraft"),
            new SubDef("auto", "car-rentals", "Car Rentals", "<i class=\"fa-solid fa-key\"></i>", "#F3E5F5", "Short and long term vehicle rentals"),
            new SubDef("auto", "parts", "Parts & Accessories", "<i class=\"fa-solid fa-screwdriver-wrench\"></i>", "#FBE9E7", "Parts and accessories for vehicles"),

            // Real Estate: аренда и продажа в одной категории, Housing упразднена
            new SubDef("realestate", "rent-homes", "Apartments & Houses for Rent", "<i class=\"fa-solid fa-key\"></i>", "#E5F0FF", "Long-term rentals: apartments, houses, condos"),
            new SubDef("realestate", "sale-homes", "Apartments & Houses for Sale", "<i class=\"fa-solid fa-house\"></i>", "#E3F2FD", "Homes, condos and townhouses for sale"),
            new SubDef("realestate", "commercial", "Commercial Property", "<i class=\"fa-solid fa-building\"></i>", "#ECEFF1", "Offices, retail, warehouses, for lease or sale"),
            new SubDef("realestate", "land", "Land for Sale", "<i class=\"fa-solid fa-mountain-sun\"></i>", "#E8F5E9", "Lots, acreage and development parcels"),
            new SubDef("realestate", "rooms-roommates", "Rooms & Roommates", "<i class=\"fa-solid fa-user-group\"></i>", "#FFF3E0", "Rooms for rent, shared housing, roommate wanted"),
            new SubDef("realestate", "short-term", "Short-Term & Vacation Rentals", "<i class=\"fa-solid fa-umbrella-beach\"></i>", "#FFF9C4", "Nightly, weekly and seasonal stays"),

            // Food
            new SubDef("food", "alcohol", "Alcohol & Wine", "<i class=\"fa-solid fa-wine-glass\"></i>", "#F3E5F5", null),
            new SubDef("food", "grocery", "Pantry & Canned Goods", "<i class=\"fa-solid fa-box-archive\"></i>", "#EFEBE9", null),
            new SubDef("food", "frozen", "Frozen Food", "<i class=\"fa-solid fa-snowflake\"></i>", "#E1F5FE", null),
            new SubDef("food", "healthy", "Health Food", "<i class=\"fa-solid fa-leaf\"></i>", "#E8F5E9", null),
            new SubDef("food", "coffee-tea", "Coffee & Tea", "<i class=\"fa-solid fa-mug-hot\"></i>", "#EFEBE9", null),
            new SubDef("food", "sausages", "Sausages & Deli Meat", "<i class=\"fa-solid fa-drumstick-bite\"></i>", "#FBE9E7", null),
            new SubDef("food", "ready-meals", "Ready Meals & Takeout", "<i class=\"fa-solid fa-utensils\"></i>", "#F3E5F5", null),
            new SubDef("food", "dairy", "Dairy & Eggs", "<i class=\"fa-solid fa-egg\"></i>", "#E1F5FE", null),
            new SubDef("food", "meat", "Meat & Poultry", "<i class=\"fa-solid fa-burger\"></i>", "#FFEBEE", null),
            new SubDef("food", "drinks", "Beverages", "<i class=\"fa-solid fa-bottle-water\"></i>", "#E3F2FD", null),
            new SubDef("food", "fish", "Fish & Seafood", "<i class=\"fa-solid fa-fish\"></i>", "#E3F2FD", null),
            new SubDef("food", "cigarettes", "Tobacco & Vape", "<i class=\"fa-solid fa-smoking\"></i>", "#ECEFF1", null),
            new SubDef("food", "cheese", "Cheese", "<i class=\"fa-solid fa-cheese\"></i>", "#FFFDE7", null),
            new SubDef("food", "snacks", "Snacks & Chips", "<i class=\"fa-solid fa-cookie-bite\"></i>", "#FFF9C4", null),
            new SubDef("food", "sweets", "Candy & Sweets", "<i class=\"fa-solid fa-candy-cane\"></i>", "#FCE4EC", null),
            new SubDef("food", "sauces", "Sauces & Spices", "<i class=\"fa-solid fa-pepper-hot\"></i>", "#FCE4EC", null),
            new SubDef("food", "fruits-vegetables", "Fruits & Vegetables", "<i class=\"fa-solid fa-apple-whole\"></i>", "#E8F5E9", null),
            new SubDef("food", "bread", "Bread & Bakery", "<i class=\"fa-solid fa-bread-slice\"></i>", "#FFF8E1", null),

            // Cosmetics
            // Ровно 12 плиток в алфавитном порядке: sortOrder берётся из позиции
            // в этом списке, поэтому порядок объявления и есть порядок на странице
            new SubDef("cosmetics", "beauty-tools", "Beauty Tools & Devices", "<i class=\"fa-solid fa-brush\"></i>", "#FFE0B2", null),
            new SubDef("cosmetics", "body-care", "Body Care", "<i class=\"fa-solid fa-soap\"></i>", "#B2EBF2", null),
            new SubDef("cosmetics", "face-cleansing", "Face Cleansing & Toning", "<i class=\"fa-solid fa-droplet\"></i>", "#FCE4EC", null),
            new SubDef("cosmetics", "face-treatments", "Face Creams, Serums & SPF", "<i class=\"fa-solid fa-vial\"></i>", "#F8BBD9", null),
            new SubDef("cosmetics", "gift-sets", "Gift Sets & Kits", "<i class=\"fa-solid fa-gift\"></i>", "#FFCDD2", null),
            new SubDef("cosmetics", "hair-care", "Hair Care & Coloring", "<i class=\"fa-solid fa-pump-soap\"></i>", "#C8E6C9", null),
            new SubDef("cosmetics", "hair-styling", "Hair Styling", "<i class=\"fa-solid fa-wind\"></i>", "#DCEDC8", null),
            new SubDef("cosmetics", "hands-nails", "Hands, Feet & Nails", "<i class=\"fa-solid fa-hand-sparkles\"></i>", "#FFF9C4", null),
            new SubDef("cosmetics", "makeup", "Makeup & Cosmetics", "<i class=\"fa-solid fa-wand-magic-sparkles\"></i>", "#F48FB1", null),
            new SubDef("cosmetics", "mens", "Men's Grooming", "<i class=\"fa-solid fa-user-tie\"></i>", "#BBDEFB", null),
            new SubDef("cosmetics", "perfume", "Perfume & Fragrance", "<i class=\"fa-solid fa-spray-can-sparkles\"></i>", "#E1BEE7", null),
            new SubDef("cosmetics", "pharmacy", "Pharmacy & Medicated Skincare", "<i class=\"fa-solid fa-pills\"></i>", "#F1F8E9", null)
    );

    private void buildSubcategories(List<SubDef> subs, List<SubSubDef> subsubs) {
        // sortOrder берётся из позиции в списке: порядок объявления здесь
        // и есть порядок плиток на странице
        java.util.Map<String, Integer> orderByCategory = new java.util.HashMap<>();
        for (SubDef s : subs) {
            int order = orderByCategory.merge(s.parentSlug(), 1, Integer::sum);
            categoryRepository.findBySlug(s.parentSlug()).ifPresent(cat -> {
                Subcategory sub = new Subcategory();
                sub.setCategory(cat);
                sub.setSlug(s.slug());
                sub.setName(s.name());
                sub.setIcon(s.icon());
                sub.setColor(s.color());
                sub.setDescription(s.desc());
                sub.setSortOrder(order);
                subcategoryRepository.save(sub);
            });
        }
        buildSubSubcategories(subsubs);
    }

    // Cosmetics sub-subcategories (level 3)
    private static final List<SubSubDef> SUB_SUB_DEFS = List.of(
            new SubSubDef("cosmetics", "pharmacy", "cica", "Repair & Recovery (Cica)", "<i class=\"fa-solid fa-seedling\"></i>", "#DCEDC8", "barrier creams, centella, panthenol"),
            new SubSubDef("cosmetics", "pharmacy", "sterile", "Sensitive Skin Care", "<i class=\"fa-solid fa-flask\"></i>", "#F1F8E9", "preservative-free products for sensitive skin"),
            new SubSubDef("cosmetics", "pharmacy", "therapy", "Skin Therapy", "<i class=\"fa-solid fa-stethoscope\"></i>", "#DCEDC8", "acne, rosacea, atopic dermatitis treatments"),

            new SubSubDef("cosmetics", "face-cleansing", "demaq", "Makeup Removal", "<i class=\"fa-solid fa-eraser\"></i>", "#FCE4EC", "cleansing oils, balms, micellar water"),
            new SubSubDef("cosmetics", "face-cleansing", "cleansing", "Cleansing & Washing", "<i class=\"fa-solid fa-droplet\"></i>", "#FFCCBC", "gels, foams, cleansing creams"),
            new SubSubDef("cosmetics", "face-cleansing", "toners", "Toners & Essences", "<i class=\"fa-solid fa-bottle-water\"></i>", "#F8BBD9", "toners, essences, micellar water"),
            new SubSubDef("cosmetics", "face-cleansing", "peeling", "Exfoliation & Peels", "<i class=\"fa-solid fa-layer-group\"></i>", "#CE93D8", "enzyme powders, acid peels, gentle exfoliants"),
            new SubSubDef("cosmetics", "face-cleansing", "toning", "Toning", "<i class=\"fa-solid fa-spa\"></i>", "#F8BBD9", "toners, softeners, floral waters"),

            new SubSubDef("cosmetics", "makeup", "lip-gloss", "Gloss & Plumpers", "<i class=\"fa-solid fa-star\"></i>", "#F8BBD9", "lip glosses, oils, plumpers"),
            new SubSubDef("cosmetics", "makeup", "lip-care", "Lip Care", "<i class=\"fa-solid fa-heart\"></i>", "#EF9A9A", "balms, overnight lip masks"),
            new SubSubDef("cosmetics", "makeup", "lip-color", "Lip Color", "<i class=\"fa-solid fa-palette\"></i>", "#FCE4EC", "lipstick, liquid matte, tints"),
            new SubSubDef("cosmetics", "makeup", "lip-liner", "Lip Liner", "<i class=\"fa-solid fa-pencil\"></i>", "#F48FB1", "wax and gel lip pencils"),

            new SubSubDef("cosmetics", "makeup", "concealer", "Concealer & Color Corrector", "<i class=\"fa-solid fa-paintbrush\"></i>", "#EF9A9A", "concealers, color correctors"),
            new SubSubDef("cosmetics", "makeup", "primer", "Primer & Setting Spray", "<i class=\"fa-solid fa-shield-halved\"></i>", "#CE93D8", "primers, pore fillers, setting sprays"),
            new SubSubDef("cosmetics", "makeup", "sculpt", "Contour, Bronzer & Blush", "<i class=\"fa-solid fa-wand-magic-sparkles\"></i>", "#F48FB1", "sculpting, bronzers, highlighters, blush"),
            new SubSubDef("cosmetics", "makeup", "foundation", "Foundation & BB/CC Cream", "<i class=\"fa-solid fa-fill-drip\"></i>", "#FCE4EC", "cushions, BB/CC creams, foundation fluids"),
            new SubSubDef("cosmetics", "makeup", "powder", "Setting Powder", "<i class=\"fa-solid fa-cloud\"></i>", "#F8BBD9", "loose and pressed powders"),

            new SubSubDef("cosmetics", "makeup", "eye-base", "Eye Primer", "<i class=\"fa-solid fa-shield\"></i>", "#F8BBD9", "eyelid primers, mascara base"),
            new SubSubDef("cosmetics", "makeup", "brow", "Brow Products", "<i class=\"fa-solid fa-minus\"></i>", "#F48FB1", "pencils, markers, pomades, brow gels"),
            new SubSubDef("cosmetics", "makeup", "eyes", "Eye Makeup", "<i class=\"fa-solid fa-eye\"></i>", "#CE93D8", "eyeshadow, eyeliner, kohl, mascara"),

            new SubSubDef("cosmetics", "hands-nails", "cuticle", "Cuticle Care", "<i class=\"fa-solid fa-hand-dots\"></i>", "#FFF9C4", "cuticle oils and removers"),
            new SubSubDef("cosmetics", "hands-nails", "nails", "Nail Polish & Gel", "<i class=\"fa-solid fa-hand-sparkles\"></i>", "#FFFDE7", "base coats, nail polish, gel nails"),
            new SubSubDef("cosmetics", "hands-nails", "hands-feet", "Hand & Foot Care", "<i class=\"fa-solid fa-hands\"></i>", "#FFF9C4", "nourishing creams, masks, heel care"),

            new SubSubDef("cosmetics", "body-care", "exfoliate", "Exfoliation", "<i class=\"fa-solid fa-rotate\"></i>", "#B2DFDB", "scrubs, peels, exfoliating gloves"),
            new SubSubDef("cosmetics", "body-care", "moistbody", "Body Moisturizing", "<i class=\"fa-solid fa-pump-soap\"></i>", "#B2EBF2", "lotions, body butters, body oils"),
            new SubSubDef("cosmetics", "body-care", "shower", "Shower & Bath", "<i class=\"fa-solid fa-shower\"></i>", "#B3E5FC", "shower gels, soaps, bath foams"),
            new SubSubDef("cosmetics", "body-care", "special", "Specialty Body Care", "<i class=\"fa-solid fa-dumbbell\"></i>", "#C8E6C9", "anti-cellulite, deodorants, stretch mark care"),

            new SubSubDef("cosmetics", "face-treatments", "moistday", "Day Creams & Moisturizers", "<i class=\"fa-solid fa-shield\"></i>", "#F48FB1", "day creams, emulsions, fluids"),
            new SubSubDef("cosmetics", "face-treatments", "evening", "Night Care", "<i class=\"fa-solid fa-moon\"></i>", "#F8BBD9", "night creams, sleeping packs"),
            new SubSubDef("cosmetics", "face-treatments", "serums", "Serums & Concentrates", "<i class=\"fa-solid fa-vial\"></i>", "#F8BBD9", "vitamin C, retinol, peptides, actives"),
            new SubSubDef("cosmetics", "face-treatments", "eye-zone", "Eye Area Care", "<i class=\"fa-solid fa-eye\"></i>", "#EF9A9A", "creams, gels, serums, eye patches"),
            new SubSubDef("cosmetics", "face-treatments", "masks", "Face Masks & Patches", "<i class=\"fa-solid fa-mask\"></i>", "#F48FB1", "sheet, clay, alginate, sleeping masks, patches"),
            new SubSubDef("cosmetics", "face-treatments", "spf-face", "Face Sunscreen (SPF)", "<i class=\"fa-solid fa-sun\"></i>", "#FFF3E0", "mineral and chemical SPF creams and sticks"),

            new SubSubDef("cosmetics", "hair-care", "shampoo", "Shampoo", "<i class=\"fa-solid fa-soap\"></i>", "#B2DFDB", "sulfate-free, clarifying, volumizing"),
            new SubSubDef("cosmetics", "hair-care", "rinse-out", "Rinse-Out Care", "<i class=\"fa-solid fa-droplet\"></i>", "#DCEDC8", "conditioners, balms, hair masks"),
            new SubSubDef("cosmetics", "hair-care", "leave-in", "Leave-In Care", "<i class=\"fa-solid fa-bottle-droplet\"></i>", "#C8E6C9", "heat protectants, oils, scalp serums"),

            new SubSubDef("cosmetics", "body-care", "spf-body", "Body Sunscreen (SPF)", "<i class=\"fa-solid fa-umbrella-beach\"></i>", "#FFE0B2", "SPF sprays, lotions, oils"),
            new SubSubDef("cosmetics", "body-care", "after-sun", "After Sun", "<i class=\"fa-solid fa-temperature-low\"></i>", "#FFCCBC", "soothing gels (aloe, panthenol), after-sun milk"),

            new SubSubDef("cosmetics", "hair-styling", "volume", "Volume", "<i class=\"fa-solid fa-wind\"></i>", "#C8E6C9", "root powders, volumizing sprays"),
            new SubSubDef("cosmetics", "hair-styling", "texture", "Texture", "<i class=\"fa-solid fa-sliders\"></i>", "#B2DFDB", "waxes, clays, salt sprays"),
            new SubSubDef("cosmetics", "hair-styling", "fixation", "Hold & Finish", "<i class=\"fa-solid fa-spray-can\"></i>", "#DCEDC8", "hairspray, mousse, styling foam"),
            new SubSubDef("cosmetics", "hair-styling", "dry-shampoo", "Dry Shampoo", "<i class=\"fa-solid fa-spray-can-sparkles\"></i>", "#C5E1A5", "refresh between washes, root volume"),

            new SubSubDef("cosmetics", "mens", "beard", "Beard & Mustache", "<i class=\"fa-solid fa-person\"></i>", "#BBDEFB", "beard shampoo, oils, waxes, balms"),
            new SubSubDef("cosmetics", "mens", "shaving", "Shaving", "<i class=\"fa-solid fa-razor\"></i>", "#E3F2FD", "shaving foam, gel, cream"),
            new SubSubDef("cosmetics", "mens", "aftershave", "Aftershave", "<i class=\"fa-solid fa-bottle-droplet\"></i>", "#BBDEFB", "balms, lotions, aftershave cologne"),

            new SubSubDef("cosmetics", "perfume", "perfume-women", "Women's Fragrance", "<i class=\"fa-solid fa-spray-can-sparkles\"></i>", "#F8BBD9", "eau de parfum, eau de toilette"),
            new SubSubDef("cosmetics", "perfume", "perfume-men", "Men's Fragrance", "<i class=\"fa-solid fa-spray-can\"></i>", "#BBDEFB", "eau de toilette, cologne, aftershave scents"),
            new SubSubDef("cosmetics", "perfume", "perfume-unisex", "Unisex & Niche", "<i class=\"fa-solid fa-flask-vial\"></i>", "#E1BEE7", "niche houses, unisex compositions, samples"),
            new SubSubDef("cosmetics", "perfume", "home-fragrance", "Home Fragrance", "<i class=\"fa-solid fa-candle-holder\"></i>", "#FFF3E0", "candles, diffusers, room sprays"),

            new SubSubDef("cosmetics", "hair-care", "permanent-color", "Permanent Color", "<i class=\"fa-solid fa-palette\"></i>", "#D1C4E9", "permanent dye kits, cream color"),
            new SubSubDef("cosmetics", "hair-care", "semi-permanent", "Semi-Permanent & Tinted", "<i class=\"fa-solid fa-brush\"></i>", "#E1BEE7", "tinted masks, color conditioners, toners"),
            new SubSubDef("cosmetics", "hair-care", "bleach", "Bleach & Lighteners", "<i class=\"fa-solid fa-sun\"></i>", "#FFF9C4", "powder bleach, developers, highlighting kits"),
            new SubSubDef("cosmetics", "hair-care", "color-care", "Color Care", "<i class=\"fa-solid fa-shield\"></i>", "#C8E6C9", "color-safe shampoo, purple shampoo, bond builders"),

            new SubSubDef("cosmetics", "beauty-tools", "makeup-brushes", "Makeup Brushes & Sponges", "<i class=\"fa-solid fa-brush\"></i>", "#FFE0B2", "brush sets, beauty blenders, applicators"),
            new SubSubDef("cosmetics", "beauty-tools", "hair-brushes", "Combs & Hair Brushes", "<i class=\"fa-solid fa-wind\"></i>", "#DCEDC8", "detangling brushes, combs, round brushes"),
            new SubSubDef("cosmetics", "beauty-tools", "nail-tools", "Manicure & Pedicure Tools", "<i class=\"fa-solid fa-hand-sparkles\"></i>", "#FFF9C4", "clippers, files, cuticle tools, foot files"),
            new SubSubDef("cosmetics", "beauty-tools", "mirrors-bags", "Mirrors & Cosmetic Bags", "<i class=\"fa-solid fa-suitcase\"></i>", "#F3E5F5", "makeup bags, organizers, mirrors"),

            new SubSubDef("cosmetics", "beauty-tools", "hair-dryers", "Hair Dryers", "<i class=\"fa-solid fa-wind\"></i>", "#B3E5FC", "dryers, diffusers, brush dryers"),
            new SubSubDef("cosmetics", "beauty-tools", "stylers", "Straighteners & Curlers", "<i class=\"fa-solid fa-bolt\"></i>", "#E1F5FE", "flat irons, curling wands, multi-stylers"),
            new SubSubDef("cosmetics", "beauty-tools", "trimmers", "Trimmers & Shavers", "<i class=\"fa-solid fa-razor\"></i>", "#E3F2FD", "beard trimmers, clippers, electric shavers, epilators"),
            new SubSubDef("cosmetics", "beauty-tools", "skin-devices", "Skincare Devices", "<i class=\"fa-solid fa-wand-sparkles\"></i>", "#F3E5F5", "cleansing brushes, LED masks, microcurrent devices"),

            new SubSubDef("cosmetics", "gift-sets", "gift-skincare", "Skincare Sets", "<i class=\"fa-solid fa-box-open\"></i>", "#FFCDD2", "cleanser and cream kits, travel sets"),
            new SubSubDef("cosmetics", "gift-sets", "gift-fragrance", "Fragrance Sets", "<i class=\"fa-solid fa-gift\"></i>", "#F8BBD9", "perfume and body care gift boxes"),
            new SubSubDef("cosmetics", "gift-sets", "gift-makeup", "Makeup Sets & Palettes", "<i class=\"fa-solid fa-palette\"></i>", "#F48FB1", "palettes, brush kits, starter sets"),
            new SubSubDef("cosmetics", "gift-sets", "gift-hair", "Hair Care Sets", "<i class=\"fa-solid fa-pump-soap\"></i>", "#C8E6C9", "shampoo and conditioner duos, styling kits")
    );

    private void buildSubSubcategories(List<SubSubDef> subsubs) {
        java.util.Map<String, Integer> orderByParent = new java.util.HashMap<>();
        for (SubSubDef ss : subsubs) {
            Optional<Category> cat = categoryRepository.findBySlug(ss.categorySlug());
            if (cat.isEmpty()) continue;
            // Find parent subcategory by slug
            Optional<Subcategory> parent = subcategoryRepository.findByCategorySlugAndParentIsNullOrderBySortOrderAscNameAsc(ss.categorySlug()).stream()
                .filter(s -> ss.parentSubSlug().equals(s.getSlug()))
                .findFirst();
            if (parent.isEmpty()) continue;

            Subcategory sub = new Subcategory();
            sub.setCategory(cat.get());
            sub.setParent(parent.get());
            sub.setSlug(ss.slug());
            sub.setName(ss.name());
            sub.setIcon(ss.icon());
            sub.setColor(ss.color());
            sub.setDescription(ss.desc());
            sub.setSortOrder(orderByParent.merge(
                ss.categorySlug() + "/" + ss.parentSubSlug(), 1, Integer::sum));
            subcategoryRepository.save(sub);
        }
    }

    private record CityDef(String name, String subdomain) {}

    // Largest city of each of the 50 US states + Washington, DC (51 entries).
    // US marketplace standard format "City, ST" (eBay / Facebook Marketplace / Craigslist).
    private static final List<CityDef> CITY_DEFS = new java.util.ArrayList<>();

    @Transactional
    private void syncCities() {
        log.info("Syncing cities, current count: {}", cityRepository.count());
        log.info("Cities sync skipped. Managed via SQL migrations.");
    }

}
