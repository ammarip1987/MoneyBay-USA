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

    public DataInitializer(CategoryRepository categoryRepository,
                           CityRepository cityRepository,
                           SubcategoryRepository subcategoryRepository) {
        this.categoryRepository = categoryRepository;
        this.cityRepository = cityRepository;
        this.subcategoryRepository = subcategoryRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        log.info("DataInitializer started");
        upsertCategories();
        syncCities();
        log.info("Cities synced, count: {}", cityRepository.count());
        // Resync subcategory hierarchy if count differs from expected (41 subs + 36 subsubs = 77)
        if (subcategoryRepository.count() < 75) {
            subcategoryRepository.deleteAll();
            initAllSubcategories();
        }
    }

    private record CatDef(String slug, String name, String description, String icon, String color) {}
    private record SubDef(String parentSlug, String slug, String name, String icon, String color, String desc) {}
    private record SubSubDef(String categorySlug, String parentSubSlug, String slug, String name, String icon, String color, String desc) {}

    private void upsertCategories() {
        List<CatDef> cats = List.of(
            new CatDef("kids-baby", "Kids & Baby", "Baby gear, toys, clothing and more", "<i class=\"fas fa-child\"></i>", "#FFE5E5"),
            new CatDef("realestate", "Real Estate", "Buy, sell and rent property", "<i class=\"fas fa-building\"></i>", "#E5F0FF"),
            new CatDef("auto", "Vehicles", "Cars, trucks and motorcycles", "<i class=\"fas fa-car\"></i>", "#E5FFE5"),
            new CatDef("jobs", "Jobs", "Job listings and resumes", "<i class=\"fas fa-briefcase\"></i>", "#F0E5FF"),
            new CatDef("animals", "Pets", "Animals, pet supplies and services", "<i class=\"fas fa-paw\"></i>", "#FFE5F0"),
            new CatDef("electronics", "Electronics", "Phones, computers and gadgets", "<i class=\"fas fa-mobile-alt\"></i>", "#E5F5FF"),
            new CatDef("clothes", "Fashion", "Clothing, shoes and accessories", "<i class=\"fas fa-tshirt\"></i>", "#FFE5E5"),
            new CatDef("food", "Food & Grocery", "Food, drinks and specialty items", "<i class=\"fas fa-shopping-cart\"></i>", "#FFF9E5"),
            new CatDef("cosmetics", "Beauty & Cosmetics", "Skincare and beauty products", "<i class=\"fas fa-spa\"></i>", "#FCE4EC"),
            new CatDef("business", "Business & Services", "Business equipment and professional services", "<i class=\"fas fa-handshake\"></i>", "#E5FFF5"),
            new CatDef("hobby", "Hobbies & Sports", "Sports gear, tickets and collectibles", "<i class=\"fas fa-football-ball\"></i>", "#E5E5FF"),
            new CatDef("home", "Home & Garden", "Furniture, appliances and garden", "<i class=\"fas fa-home\"></i>", "#E5FFE5"),
            new CatDef("rental", "Housing", "Short and long-term rentals", "<i class=\"fas fa-key\"></i>", "#F0E5FF")
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

    private void initAllSubcategories() {
        // Subcategories (level 2)
        List<SubDef> subs = List.of(
            // Vehicles
            new SubDef("auto", "cars-trucks", "Cars & Trucks", "<i class=\"fa-solid fa-car\"></i>", "#E3F2FD", "New and used cars, trucks, SUVs and vans"),
            new SubDef("auto", "motorcycles", "Motorcycles", "<i class=\"fa-solid fa-motorcycle\"></i>", "#FFF3E0", "Motorcycles, scooters and mopeds"),
            new SubDef("auto", "rvs-campers", "RVs & Campers", "<i class=\"fa-solid fa-caravan\"></i>", "#E8F5E9", "Motorhomes, travel trailers and camper vans"),
            new SubDef("auto", "boats", "Boats & Watercraft", "<i class=\"fa-solid fa-sailboat\"></i>", "#E1F5FE", "Boats, jet skis and other watercraft"),
            new SubDef("auto", "car-rentals", "Car Rentals", "<i class=\"fa-solid fa-key\"></i>", "#F3E5F5", "Short and long term vehicle rentals"),
            new SubDef("auto", "parts", "Parts & Accessories", "<i class=\"fa-solid fa-screwdriver-wrench\"></i>", "#FBE9E7", "Parts and accessories for vehicles"),

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
            new SubDef("cosmetics", "pharmacy", "Pharmacy & Medicated Skincare", "<i class=\"fa-solid fa-pills\"></i>", "#F1F8E9", null),
            new SubDef("cosmetics", "face-basic", "Basic Face Care", "<i class=\"fa-solid fa-face-smile\"></i>", "#FCE4EC", null),
            new SubDef("cosmetics", "makeup-lips", "Lip Makeup", "<i class=\"fa-solid fa-heart\"></i>", "#EF9A9A", null),
            new SubDef("cosmetics", "makeup-face", "Face Makeup & Foundation", "<i class=\"fa-solid fa-wand-magic-sparkles\"></i>", "#F48FB1", null),
            new SubDef("cosmetics", "makeup-eyes", "Eye & Brow Makeup", "<i class=\"fa-solid fa-eye\"></i>", "#CE93D8", null),
            new SubDef("cosmetics", "hands-nails", "Hands, Feet & Nails", "<i class=\"fa-solid fa-hand-sparkles\"></i>", "#FFF9C4", null),
            new SubDef("cosmetics", "body-care", "Body Care", "<i class=\"fa-solid fa-soap\"></i>", "#B2EBF2", null),
            new SubDef("cosmetics", "face-intensive", "Intensive & Special Face Care", "<i class=\"fa-solid fa-droplet\"></i>", "#F8BBD9", null),
            new SubDef("cosmetics", "hair-care", "Hair Care", "<i class=\"fa-solid fa-scissors\"></i>", "#C8E6C9", null),
            new SubDef("cosmetics", "spf", "Sun Protection (SPF)", "<i class=\"fa-solid fa-sun\"></i>", "#FFF3E0", null),
            new SubDef("cosmetics", "hair-styling", "Hair Styling", "<i class=\"fa-solid fa-wind\"></i>", "#DCEDC8", null),
            new SubDef("cosmetics", "mens", "Men's Grooming", "<i class=\"fa-solid fa-user-tie\"></i>", "#BBDEFB", null)
        );

        for (SubDef s : subs) {
            categoryRepository.findBySlug(s.parentSlug()).ifPresent(cat -> {
                Subcategory sub = new Subcategory();
                sub.setCategory(cat);
                sub.setSlug(s.slug());
                sub.setName(s.name());
                sub.setIcon(s.icon());
                sub.setColor(s.color());
                sub.setDescription(s.desc());
                subcategoryRepository.save(sub);
            });
        }

        // Cosmetics sub-subcategories (level 3)
        List<SubSubDef> subsubs = List.of(
            new SubSubDef("cosmetics", "pharmacy", "cica", "Repair & Recovery (Cica)", "<i class=\"fa-solid fa-seedling\"></i>", "#DCEDC8", "barrier creams, centella, panthenol"),
            new SubSubDef("cosmetics", "pharmacy", "sterile", "Sensitive Skin Care", "<i class=\"fa-solid fa-flask\"></i>", "#F1F8E9", "preservative-free products for sensitive skin"),
            new SubSubDef("cosmetics", "pharmacy", "therapy", "Skin Therapy", "<i class=\"fa-solid fa-stethoscope\"></i>", "#DCEDC8", "acne, rosacea, atopic dermatitis treatments"),

            new SubSubDef("cosmetics", "face-basic", "evening", "Night Care", "<i class=\"fa-solid fa-moon\"></i>", "#F8BBD9", "night creams, sleeping packs"),
            new SubSubDef("cosmetics", "face-basic", "demaq", "Makeup Removal", "<i class=\"fa-solid fa-eraser\"></i>", "#FCE4EC", "cleansing oils, balms, micellar water"),
            new SubSubDef("cosmetics", "face-basic", "moistday", "Moisturizing & Protection", "<i class=\"fa-solid fa-shield\"></i>", "#F48FB1", "day creams, emulsions, fluids with SPF"),
            new SubSubDef("cosmetics", "face-basic", "cleansing", "Cleansing & Washing", "<i class=\"fa-solid fa-droplet\"></i>", "#FFCCBC", "gels, foams, cleansing creams"),
            new SubSubDef("cosmetics", "face-basic", "toning", "Toning", "<i class=\"fa-solid fa-spa\"></i>", "#F8BBD9", "toners, softeners, floral waters"),

            new SubSubDef("cosmetics", "makeup-lips", "lip-gloss", "Gloss & Plumpers", "<i class=\"fa-solid fa-star\"></i>", "#F8BBD9", "lip glosses, oils, plumpers"),
            new SubSubDef("cosmetics", "makeup-lips", "lip-care", "Lip Care", "<i class=\"fa-solid fa-heart\"></i>", "#EF9A9A", "balms, overnight lip masks"),
            new SubSubDef("cosmetics", "makeup-lips", "lip-color", "Lip Color", "<i class=\"fa-solid fa-palette\"></i>", "#FCE4EC", "lipstick, liquid matte, tints"),
            new SubSubDef("cosmetics", "makeup-lips", "lip-liner", "Lip Liner", "<i class=\"fa-solid fa-pencil\"></i>", "#F48FB1", "wax and gel lip pencils"),

            new SubSubDef("cosmetics", "makeup-face", "concealer", "Concealer & Color Corrector", "<i class=\"fa-solid fa-paintbrush\"></i>", "#EF9A9A", "concealers, color correctors"),
            new SubSubDef("cosmetics", "makeup-face", "primer", "Primer & Setting Spray", "<i class=\"fa-solid fa-shield-halved\"></i>", "#CE93D8", "primers, pore fillers, setting sprays"),
            new SubSubDef("cosmetics", "makeup-face", "sculpt", "Contour, Bronzer & Blush", "<i class=\"fa-solid fa-wand-magic-sparkles\"></i>", "#F48FB1", "sculpting, bronzers, highlighters, blush"),
            new SubSubDef("cosmetics", "makeup-face", "foundation", "Foundation & BB/CC Cream", "<i class=\"fa-solid fa-fill-drip\"></i>", "#FCE4EC", "cushions, BB/CC creams, foundation fluids"),
            new SubSubDef("cosmetics", "makeup-face", "powder", "Setting Powder", "<i class=\"fa-solid fa-cloud\"></i>", "#F8BBD9", "loose and pressed powders"),

            new SubSubDef("cosmetics", "makeup-eyes", "eye-base", "Eye Primer", "<i class=\"fa-solid fa-shield\"></i>", "#F8BBD9", "eyelid primers, mascara base"),
            new SubSubDef("cosmetics", "makeup-eyes", "brow", "Brow Products", "<i class=\"fa-solid fa-minus\"></i>", "#F48FB1", "pencils, markers, pomades, brow gels"),
            new SubSubDef("cosmetics", "makeup-eyes", "eyes", "Eye Makeup", "<i class=\"fa-solid fa-eye\"></i>", "#CE93D8", "eyeshadow, eyeliner, kohl, mascara"),

            new SubSubDef("cosmetics", "hands-nails", "cuticle", "Cuticle Care", "<i class=\"fa-solid fa-hand-dots\"></i>", "#FFF9C4", "cuticle oils and removers"),
            new SubSubDef("cosmetics", "hands-nails", "nails", "Nail Polish & Gel", "<i class=\"fa-solid fa-hand-sparkles\"></i>", "#FFFDE7", "base coats, nail polish, gel nails"),
            new SubSubDef("cosmetics", "hands-nails", "hands-feet", "Hand & Foot Care", "<i class=\"fa-solid fa-hands\"></i>", "#FFF9C4", "nourishing creams, masks, heel care"),

            new SubSubDef("cosmetics", "body-care", "exfoliate", "Exfoliation", "<i class=\"fa-solid fa-rotate\"></i>", "#B2DFDB", "scrubs, peels, exfoliating gloves"),
            new SubSubDef("cosmetics", "body-care", "moistbody", "Body Moisturizing", "<i class=\"fa-solid fa-pump-soap\"></i>", "#B2EBF2", "lotions, body butters, body oils"),
            new SubSubDef("cosmetics", "body-care", "shower", "Shower & Bath", "<i class=\"fa-solid fa-shower\"></i>", "#B3E5FC", "shower gels, soaps, bath foams"),
            new SubSubDef("cosmetics", "body-care", "special", "Specialty Body Care", "<i class=\"fa-solid fa-dumbbell\"></i>", "#C8E6C9", "anti-cellulite, deodorants, stretch mark care"),

            new SubSubDef("cosmetics", "face-intensive", "eye-zone", "Eye Area Care", "<i class=\"fa-solid fa-eye\"></i>", "#EF9A9A", "creams, gels, serums, eye patches"),
            new SubSubDef("cosmetics", "face-intensive", "peeling", "Exfoliation & Peels", "<i class=\"fa-solid fa-layer-group\"></i>", "#CE93D8", "enzyme powders, acid peels, gentle exfoliants"),
            new SubSubDef("cosmetics", "face-intensive", "masks", "Face Masks", "<i class=\"fa-solid fa-mask\"></i>", "#F48FB1", "sheet, clay, alginate, sleeping masks"),
            new SubSubDef("cosmetics", "face-intensive", "serums", "Serums & Concentrates", "<i class=\"fa-solid fa-vial\"></i>", "#F8BBD9", "vitamin C, retinol, peptides, actives"),

            new SubSubDef("cosmetics", "hair-care", "rinse-out", "Rinse-Out Care", "<i class=\"fa-solid fa-droplet\"></i>", "#DCEDC8", "conditioners, balms, hair masks"),
            new SubSubDef("cosmetics", "hair-care", "leave-in", "Leave-In Care", "<i class=\"fa-solid fa-bottle-droplet\"></i>", "#C8E6C9", "heat protectants, oils, scalp serums"),
            new SubSubDef("cosmetics", "hair-care", "shampoo", "Shampoo", "<i class=\"fa-solid fa-soap\"></i>", "#B2DFDB", "sulfate-free, dry shampoo, clarifying"),

            new SubSubDef("cosmetics", "spf", "spf-face", "Face Sunscreen", "<i class=\"fa-solid fa-sun\"></i>", "#FFF3E0", "mineral and chemical SPF creams and sticks"),
            new SubSubDef("cosmetics", "spf", "spf-body", "Body Sunscreen", "<i class=\"fa-solid fa-umbrella-beach\"></i>", "#FFE0B2", "SPF sprays, lotions, oils"),
            new SubSubDef("cosmetics", "spf", "after-sun", "After Sun", "<i class=\"fa-solid fa-temperature-low\"></i>", "#FFCCBC", "soothing gels (aloe, panthenol), after-sun milk"),

            new SubSubDef("cosmetics", "hair-styling", "volume", "Volume", "<i class=\"fa-solid fa-wind\"></i>", "#C8E6C9", "root powders, volumizing sprays"),
            new SubSubDef("cosmetics", "hair-styling", "texture", "Texture", "<i class=\"fa-solid fa-sliders\"></i>", "#B2DFDB", "waxes, clays, salt sprays"),
            new SubSubDef("cosmetics", "hair-styling", "fixation", "Hold & Finish", "<i class=\"fa-solid fa-spray-can\"></i>", "#DCEDC8", "hairspray, mousse, styling foam"),

            new SubSubDef("cosmetics", "mens", "beard", "Beard & Mustache", "<i class=\"fa-solid fa-person\"></i>", "#BBDEFB", "beard shampoo, oils, waxes, balms"),
            new SubSubDef("cosmetics", "mens", "shaving", "Shaving", "<i class=\"fa-solid fa-razor\"></i>", "#E3F2FD", "shaving foam, gel, cream"),
            new SubSubDef("cosmetics", "mens", "aftershave", "Aftershave", "<i class=\"fa-solid fa-bottle-droplet\"></i>", "#BBDEFB", "balms, lotions, aftershave cologne")
        );

        for (SubSubDef ss : subsubs) {
            Optional<Category> cat = categoryRepository.findBySlug(ss.categorySlug());
            if (cat.isEmpty()) continue;
            // Find parent subcategory by slug
            Optional<Subcategory> parent = subcategoryRepository.findByCategorySlugAndParentIsNull(ss.categorySlug()).stream()
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
            subcategoryRepository.save(sub);
        }
    }

    private record CityDef(String name, String subdomain) {}

    // Largest city of each of the 50 US states + Washington, DC (51 entries).
    // US marketplace standard format "City, ST" (eBay / Facebook Marketplace / Craigslist).
    private static final List<CityDef> CITY_DEFS = new java.util.ArrayList<>(List.of(
        new CityDef("Birmingham, AL", "birmingham-al"),
        new CityDef("Anchorage, AK", "anchorage-ak"),
        new CityDef("Phoenix, AZ", "phoenix-az"),
        new CityDef("Little Rock, AR", "littlerock-ar"),
        new CityDef("Los Angeles, CA", "losangeles-ca"),
        new CityDef("Denver, CO", "denver-co"),
        new CityDef("Bridgeport, CT", "bridgeport-ct"),
        new CityDef("Wilmington, DE", "wilmington-de"),
        new CityDef("Jacksonville, FL", "jacksonville-fl"),
        new CityDef("Atlanta, GA", "atlanta-ga"),
        new CityDef("Honolulu, HI", "honolulu-hi"),
        new CityDef("Boise, ID", "boise-id"),
        new CityDef("Chicago, IL", "chicago-il"),
        new CityDef("Indianapolis, IN", "indianapolis-in"),
        new CityDef("Des Moines, IA", "desmoines-ia"),
        new CityDef("Wichita, KS", "wichita-ks"),
        new CityDef("Louisville, KY", "louisville-ky"),
        new CityDef("New Orleans, LA", "neworleans-la"),
        new CityDef("Portland, ME", "portland-me"),
        new CityDef("Baltimore, MD", "baltimore-md"),
        new CityDef("Boston, MA", "boston-ma"),
        new CityDef("Detroit, MI", "detroit-mi"),
        new CityDef("Minneapolis, MN", "minneapolis-mn"),
        new CityDef("Jackson, MS", "jackson-ms"),
        new CityDef("Kansas City, MO", "kansascity-mo"),
        new CityDef("Billings, MT", "billings-mt"),
        new CityDef("Omaha, NE", "omaha-ne"),
        new CityDef("Las Vegas, NV", "lasvegas-nv"),
        new CityDef("Manchester, NH", "manchester-nh"),
        new CityDef("Newark, NJ", "newark-nj"),
        new CityDef("Albuquerque, NM", "albuquerque-nm"),
        new CityDef("New York City, NY", "newyorkcity-ny"),
        new CityDef("Charlotte, NC", "charlotte-nc"),
        new CityDef("Fargo, ND", "fargo-nd"),
        new CityDef("Columbus, OH", "columbus-oh"),
        new CityDef("Oklahoma City, OK", "oklahomacity-ok"),
        new CityDef("Portland, OR", "portland-or"),
        new CityDef("Philadelphia, PA", "philadelphia-pa"),
        new CityDef("Providence, RI", "providence-ri"),
        new CityDef("Charleston, SC", "charleston-sc"),
        new CityDef("Sioux Falls, SD", "siouxfalls-sd"),
        new CityDef("Nashville, TN", "nashville-tn"),
        new CityDef("Houston, TX", "houston-tx"),
        new CityDef("Salt Lake City, UT", "saltlakecity-ut"),
        new CityDef("Burlington, VT", "burlington-vt"),
        new CityDef("Virginia Beach, VA", "virginiabeach-va"),
        new CityDef("Seattle, WA", "seattle-wa"),
        new CityDef("Charleston, WV", "charleston-wv"),
        new CityDef("Milwaukee, WI", "milwaukee-wi"),
        new CityDef("Cheyenne, WY", "cheyenne-wy"),
        new CityDef("Washington, DC", "washingtondc")
    ));

    @Transactional
    private void syncCities() {
        log.info("Syncing cities, current count: {}", cityRepository.count());

        // No FK references to cities (Listing.location / User.city are plain strings),
        // so rebuild the table to exactly match CITY_DEFS and drop all legacy rows.
        cityRepository.deleteAll();
        cityRepository.flush();

        for (CityDef def : CITY_DEFS) {
            City city = new City();
            city.setName(def.name());
            city.setSubdomain(def.subdomain());
            cityRepository.save(city);
        }

        log.info("Cities synced, final count: {}", cityRepository.count());
    }


}
