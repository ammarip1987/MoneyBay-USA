-- Seed 100 test listings across categories and cities
INSERT INTO listings (title, description, price, location, area, user_id, category_id, is_active, is_featured, views, created_at) VALUES
-- Electronics (category_id=1) — 10 listings
('iPhone 15 Pro Max 256GB', 'Brand new, sealed box, all colors available. AppleCare+ included. Cash or PayPal accepted.', 1099.99, 'New York, NY', NULL, 1, 1, true, false, 145, NOW() - INTERVAL '1 day'),
('MacBook Pro M3 14-inch', 'Mint condition, 6 months old. 16GB RAM, 512GB SSD. Original packaging and accessories.', 1599.00, 'San Francisco, CA', NULL, 2, 1, true, false, 89, NOW() - INTERVAL '2 days'),
('Sony PlayStation 5 Slim Bundle', 'Includes 2 controllers, 4 games (Spider-Man 2, Horizon, FF16, Hogwarts). Like new.', 549.00, 'Los Angeles, CA', NULL, 2, 1, true, false, 203, NOW() - INTERVAL '3 days'),
('Samsung 65" QLED 4K TV', 'Q80C model, 2024 release. Used 3 months. Wall mount included.', 899.00, 'Chicago, IL', NULL, 4, 1, true, false, 76, NOW() - INTERVAL '4 days'),
('iPad Pro 12.9 M2 with Pencil', '256GB Wi-Fi, Space Gray. Includes Apple Pencil 2 and Magic Keyboard.', 999.00, 'Miami, FL', NULL, 3, 1, true, false, 112, NOW() - INTERVAL '5 days'),
('Bose QuietComfort Ultra Headphones', 'Sealed, never opened. Black color. Christmas gift, unwanted.', 379.00, 'Boston, MA', NULL, 1, 1, true, false, 54, NOW() - INTERVAL '6 days'),
('Dell XPS 15 Laptop i7 32GB', 'Excellent condition, used for design work. Touch screen, 1TB SSD.', 1450.00, 'Seattle, WA', NULL, 4, 1, true, false, 67, NOW() - INTERVAL '7 days'),
('Nintendo Switch OLED', 'White Joy-Con, complete in box. Carrying case + 8 games.', 320.00, 'Denver, CO', NULL, 5, 1, true, false, 92, NOW() - INTERVAL '8 days'),
('GoPro Hero 12 Black', 'Open box, never used. 5.3K video. Includes 64GB card.', 379.00, 'Austin, TX', NULL, 5, 1, true, false, 38, NOW() - INTERVAL '9 days'),
('Apple Watch Ultra 2 49mm', 'Titanium, Trail Loop band. Used twice. Original receipt.', 729.00, 'Portland, OR', NULL, 1, 1, true, false, 81, NOW() - INTERVAL '10 days'),

-- Vehicles (category_id=14) — 10 listings
('2020 Honda Civic EX-L Sedan', 'One owner, 42k miles, clean title, all service records. Leather, sunroof.', 21500.00, 'New York, NY', NULL, 1, 14, true, false, 320, NOW() - INTERVAL '1 day'),
('2018 Ford F-150 XLT 4x4', 'V8 5.0L, 78k miles, tow package, bedliner, well maintained.', 27900.00, 'Houston, TX', NULL, 5, 14, true, false, 412, NOW() - INTERVAL '2 days'),
('2021 Tesla Model 3 Standard Range', 'Autopilot, 28k miles, white exterior, black interior. Free supercharging.', 28500.00, 'San Francisco, CA', NULL, 2, 14, true, false, 567, NOW() - INTERVAL '3 days'),
('2017 Toyota Camry SE', '89k miles, brand new tires, recent oil change, no accidents.', 14750.00, 'Los Angeles, CA', NULL, 2, 14, true, false, 234, NOW() - INTERVAL '4 days'),
('2019 Jeep Wrangler Unlimited Sahara', '4-door, 6-speed manual, lifted, off-road tires. 52k miles.', 32000.00, 'Denver, CO', NULL, 4, 14, true, false, 189, NOW() - INTERVAL '5 days'),
('Harley Davidson Sportster 883', '2016 model, 12k miles, custom exhaust, ready to ride.', 6800.00, 'Phoenix, AZ', NULL, 3, 14, true, false, 145, NOW() - INTERVAL '6 days'),
('2022 Subaru Outback Premium', '31k miles, AWD, EyeSight safety, factory warranty remaining.', 24900.00, 'Seattle, WA', NULL, 4, 14, true, false, 178, NOW() - INTERVAL '7 days'),
('Yamaha YZF-R3 Sport Bike', '2020 model, 4k miles, beginner-friendly. Garage kept.', 4500.00, 'Miami, FL', NULL, 3, 14, true, false, 98, NOW() - INTERVAL '8 days'),
('2015 Chevy Silverado 1500 LT', '124k miles, runs great, new transmission, crew cab.', 17500.00, 'Dallas, TX', NULL, 5, 14, true, false, 156, NOW() - INTERVAL '9 days'),
('2023 Hyundai Sonata SEL Hybrid', '18k miles, like new, 50 MPG highway, factory warranty.', 23800.00, 'Boston, MA', NULL, 1, 14, true, false, 134, NOW() - INTERVAL '10 days'),

-- Real Estate (category_id=13) — 10 listings
('2BR 2BA Manhattan Apartment for Rent', '850 sqft, doorman building, gym, laundry in unit. Available immediately.', 4200.00, 'New York, NY', '850 sqft', 1, 13, true, false, 892, NOW() - INTERVAL '1 day'),
('Luxury 3BR Condo Miami Beach', 'Ocean view, pool, gym, valet parking. 1450 sqft.', 6500.00, 'Miami, FL', '1450 sqft', 3, 13, true, false, 678, NOW() - INTERVAL '2 days'),
('4BR Single Family Home Austin', '2200 sqft, large backyard, 2-car garage, quiet neighborhood.', 3800.00, 'Austin, TX', '2200 sqft', 5, 13, true, false, 456, NOW() - INTERVAL '3 days'),
('Studio Apartment Downtown LA', 'High floor, city views, walk to Whole Foods and metro.', 2200.00, 'Los Angeles, CA', '550 sqft', 2, 13, true, false, 345, NOW() - INTERVAL '4 days'),
('3BR Townhouse Boston North End', 'Historic charm, modern updates, parking spot, walk to T.', 4800.00, 'Boston, MA', '1800 sqft', 1, 13, true, false, 234, NOW() - INTERVAL '5 days'),
('Office Space for Lease Chicago Loop', '1200 sqft, 4 offices + conference room, $35/sqft annual.', 3500.00, 'Chicago, IL', '1200 sqft', 4, 13, true, false, 189, NOW() - INTERVAL '6 days'),
('5BR Single Family Estate Denver', '3500 sqft, mountain views, finished basement, hot tub.', 4500.00, 'Denver, CO', '3500 sqft', 4, 13, true, false, 167, NOW() - INTERVAL '7 days'),
('2BR Loft Brooklyn Williamsburg', 'Exposed brick, high ceilings, rooftop access. Pet friendly.', 3600.00, 'New York, NY', '1100 sqft', 1, 13, true, false, 412, NOW() - INTERVAL '8 days'),
('Beach House Rental Tampa', 'Direct beach access, sleeps 8, fully furnished. Weekly rentals.', 2800.00, 'Tampa, FL', '1900 sqft', 3, 13, true, false, 289, NOW() - INTERVAL '9 days'),
('Commercial Warehouse Seattle SODO', '5000 sqft, loading dock, 24/7 access, great for storage or workshop.', 4200.00, 'Seattle, WA', '5000 sqft', 4, 13, true, false, 145, NOW() - INTERVAL '10 days'),

-- Jobs (category_id=4) — 8 listings
('Senior React Developer — Remote $130-160k', 'Full-time, US remote, 5+ years React/TypeScript. Healthcare, 401k, equity.', 145000.00, 'San Francisco, CA', NULL, 2, 4, true, false, 234, NOW() - INTERVAL '1 day'),
('CDL Truck Driver — $85k/year', 'Long haul, weekly home time, late model trucks, sign-on bonus.', 85000.00, 'Dallas, TX', NULL, 5, 4, true, false, 178, NOW() - INTERVAL '2 days'),
('Registered Nurse — Hospital Night Shift', 'BSN required, 2+ years ICU experience. $42-58/hr + differential.', 75000.00, 'Boston, MA', NULL, 1, 4, true, false, 89, NOW() - INTERVAL '3 days'),
('Marketing Manager B2B SaaS', 'Hybrid Chicago, growth stage startup. $95-115k + equity.', 105000.00, 'Chicago, IL', NULL, 4, 4, true, false, 134, NOW() - INTERVAL '4 days'),
('Restaurant Manager — Italian Bistro', 'Downtown LA, established restaurant. Salary + bonus structure.', 65000.00, 'Los Angeles, CA', NULL, 2, 4, true, false, 56, NOW() - INTERVAL '5 days'),
('Licensed Plumber — Residential Service', 'Year-round work, company truck, benefits. Top pay.', 75000.00, 'Houston, TX', NULL, 5, 4, true, false, 67, NOW() - INTERVAL '6 days'),
('Graphic Designer — Freelance/Contract', 'Remote, 20-30 hrs/week, Adobe CC required. $45-65/hr.', 50000.00, 'New York, NY', NULL, 1, 4, true, false, 98, NOW() - INTERVAL '7 days'),
('Bartender — Upscale Hotel Lounge', 'Evenings + weekends, tips average $300/night.', 45000.00, 'Miami, FL', NULL, 3, 4, true, false, 112, NOW() - INTERVAL '8 days'),

-- Home & Garden (category_id=19) — 8 listings
('West Elm Modern Sectional Sofa', '3-piece, charcoal grey, like new. Bought 1 year ago, moving.', 1450.00, 'Los Angeles, CA', NULL, 2, 19, true, false, 145, NOW() - INTERVAL '1 day'),
('Wolf 36-inch Gas Range', 'Stainless steel, 6 burners, used in vacation home. Original $8k.', 4500.00, 'Aspen, CO', NULL, 4, 19, true, false, 89, NOW() - INTERVAL '2 days'),
('Queen Bedroom Set 5-piece', 'Bed, dresser, mirror, 2 nightstands. Solid wood, excellent.', 1200.00, 'Phoenix, AZ', NULL, 3, 19, true, false, 67, NOW() - INTERVAL '3 days'),
('Patio Furniture Set 7-piece', 'Teak table + 6 chairs, weather-resistant covers included.', 1850.00, 'Miami, FL', NULL, 3, 19, true, false, 78, NOW() - INTERVAL '4 days'),
('Husqvarna Riding Mower 48-inch', 'Used 2 seasons, great for 1+ acre lots. Recently serviced.', 1800.00, 'Austin, TX', NULL, 5, 19, true, false, 56, NOW() - INTERVAL '5 days'),
('IKEA KALLAX Bookcase x3', '5x5 white, all 3 for $200. Pickup only, you disassemble.', 200.00, 'Chicago, IL', NULL, 4, 19, true, false, 134, NOW() - INTERVAL '6 days'),
('Vintage Persian Rug 8x10', 'Hand-knotted, antique colors, no damage. Authenticated.', 2400.00, 'New York, NY', NULL, 1, 19, true, false, 92, NOW() - INTERVAL '7 days'),
('Generator 8500W Portable', 'Honda powered, 5 hours runtime. Perfect for hurricane season.', 950.00, 'Tampa, FL', NULL, 3, 19, true, false, 145, NOW() - INTERVAL '8 days'),

-- Fashion (category_id=16) — 8 listings
('Louis Vuitton Neverfull GM Monogram', '100% authentic, gently used, includes dust bag and receipt.', 1800.00, 'Beverly Hills, CA', NULL, 2, 16, true, false, 234, NOW() - INTERVAL '1 day'),
('Rolex Submariner Date 116610LN', '2018, full set, recent service. No trades.', 11500.00, 'New York, NY', NULL, 1, 16, true, false, 456, NOW() - INTERVAL '2 days'),
('Nike Air Jordan 1 Retro High OG Chicago', 'Size 10.5, deadstock, never worn. 2022 release.', 1200.00, 'Chicago, IL', NULL, 4, 16, true, false, 178, NOW() - INTERVAL '3 days'),
('Chanel Classic Flap Bag Medium', 'Black caviar, gold hardware, authentic. Slight wear.', 6500.00, 'Miami, FL', NULL, 3, 16, true, false, 189, NOW() - INTERVAL '4 days'),
('Designer Wedding Dress Vera Wang Size 6', 'Worn once, professionally cleaned. Original $4500.', 1800.00, 'Boston, MA', NULL, 1, 16, true, false, 89, NOW() - INTERVAL '5 days'),
('Patagonia Down Sweater Hoody Men L', 'New with tags, navy blue, current season.', 220.00, 'Denver, CO', NULL, 4, 16, true, false, 67, NOW() - INTERVAL '6 days'),
('Yeezy Boost 350 V2 Cream White Size 11', 'Worn 3 times, in box, original receipt.', 280.00, 'Atlanta, GA', NULL, 5, 16, true, false, 145, NOW() - INTERVAL '7 days'),
('Burberry Trench Coat Women Size 8', 'Classic camel color, like new condition.', 850.00, 'San Francisco, CA', NULL, 2, 16, true, false, 78, NOW() - INTERVAL '8 days'),

-- Hobbies & Sports (category_id=18) — 8 listings
('Trek Domane SL 7 Road Bike 56cm', 'Carbon frame, Ultegra Di2, recent tune-up. Original $7500.', 4200.00, 'Boulder, CO', NULL, 4, 18, true, false, 145, NOW() - INTERVAL '1 day'),
('Peloton Bike+ with Subscription', 'Active membership transferable. 4 months old, all accessories.', 1800.00, 'New York, NY', NULL, 1, 18, true, false, 234, NOW() - INTERVAL '2 days'),
('Wilson Pro Staff Tennis Racket', 'Mid-plus 97 sq inches, recently strung. Federer model.', 175.00, 'Miami, FL', NULL, 3, 18, true, false, 56, NOW() - INTERVAL '3 days'),
('Lakers vs Warriors Tickets 4 Seats', 'Section 110, row 5. Christmas Day game. Below face value.', 2400.00, 'Los Angeles, CA', NULL, 2, 18, true, false, 567, NOW() - INTERVAL '4 days'),
('Yamaha P-125 Digital Piano', '88 weighted keys, like new, bench included.', 580.00, 'Austin, TX', NULL, 5, 18, true, false, 89, NOW() - INTERVAL '5 days'),
('Surfboard 9-foot Longboard', 'Beginner-friendly, includes leash and wax. Great condition.', 425.00, 'San Diego, CA', NULL, 2, 18, true, false, 78, NOW() - INTERVAL '6 days'),
('Pokemon Card Collection Vintage', '1st edition Charizard, Blastoise, Venusaur PSA graded.', 8500.00, 'Seattle, WA', NULL, 4, 18, true, false, 678, NOW() - INTERVAL '7 days'),
('Ski Package — Rossignol with Boots', 'All-mountain skis 175cm, boots size 10. Used 10 times.', 380.00, 'Denver, CO', NULL, 4, 18, true, false, 134, NOW() - INTERVAL '8 days'),

-- Pets (category_id=15) — 6 listings
('Golden Retriever Puppies AKC Registered', '8 weeks old, vet checked, first shots, parents on premises.', 2200.00, 'Dallas, TX', NULL, 5, 15, true, false, 567, NOW() - INTERVAL '1 day'),
('Bengal Kitten 12 weeks', 'TICA registered, spotted, vaccinated. Indoor cat.', 1500.00, 'Phoenix, AZ', NULL, 3, 15, true, false, 234, NOW() - INTERVAL '2 days'),
('Premium Dog Food Royal Canin 30lb x2', 'Expires 2026, paid $180, asking $130 for both.', 130.00, 'Chicago, IL', NULL, 4, 15, true, false, 45, NOW() - INTERVAL '3 days'),
('Large Dog Crate 48-inch', 'Heavy duty wire crate, divider included, like new.', 75.00, 'Houston, TX', NULL, 5, 15, true, false, 56, NOW() - INTERVAL '4 days'),
('Salt Water Fish Tank 75-gallon Complete', 'Tank, stand, lights, skimmer, sump, 200lb live rock.', 850.00, 'Miami, FL', NULL, 3, 15, true, false, 89, NOW() - INTERVAL '5 days'),
('Mini Australian Shepherd 6 months', 'Blue merle, started training, microchipped, healthy.', 1200.00, 'Denver, CO', NULL, 4, 15, true, false, 178, NOW() - INTERVAL '6 days'),

-- Kids & Baby (category_id=7) — 6 listings
('Doona Convertible Car Seat Stroller', 'Excellent condition, all accessories. Save $200 vs new.', 350.00, 'New York, NY', NULL, 1, 7, true, false, 134, NOW() - INTERVAL '1 day'),
('Nursery Furniture Set Pottery Barn', 'Crib, dresser, glider chair. White finish, excellent.', 1200.00, 'Boston, MA', NULL, 1, 7, true, false, 89, NOW() - INTERVAL '2 days'),
('LEGO Sets Bundle 20+ Sets', 'Mixed sets, sorted by theme, includes Star Wars, City, Friends.', 350.00, 'Chicago, IL', NULL, 4, 7, true, false, 178, NOW() - INTERVAL '3 days'),
('UPPAbaby Vista V2 Double Stroller', '2022 model, used 6 months, all bassinet attachments.', 850.00, 'Los Angeles, CA', NULL, 2, 7, true, false, 67, NOW() - INTERVAL '4 days'),
('Kids Bedroom Set Full Size', 'Bed, dresser, desk. Light wood, great for boy or girl.', 450.00, 'Phoenix, AZ', NULL, 3, 7, true, false, 56, NOW() - INTERVAL '5 days'),
('Baby Clothes Bundle 0-12 months', 'Premium brands, gently used or new with tags. 50+ items.', 120.00, 'Austin, TX', NULL, 5, 7, true, false, 78, NOW() - INTERVAL '6 days'),

-- Food & Grocery (category_id=11) — 6 listings
('Cold Brew Coffee Concentrate 1 Gallon', 'Locally roasted, just bottled. Lasts 2 weeks refrigerated.', 25.00, 'Portland, OR', NULL, 4, 11, true, false, 45, NOW() - INTERVAL '1 day'),
('Wagyu A5 Beef 5lb', 'Imported from Japan, premium cuts. Frozen, vacuum sealed.', 450.00, 'New York, NY', NULL, 1, 11, true, false, 89, NOW() - INTERVAL '2 days'),
('Organic Honey 5lb Wildflower', 'Local beekeeper, raw unfiltered. Glass jar.', 65.00, 'Austin, TX', NULL, 5, 11, true, false, 34, NOW() - INTERVAL '3 days'),
('Italian Wine Collection 12 Bottles', 'Tuscany region, varied vintages. Personal collection.', 850.00, 'Chicago, IL', NULL, 4, 11, true, false, 78, NOW() - INTERVAL '4 days'),
('Artisan Sourdough Bread Subscription', '4 loaves per week for 8 weeks, delivered fresh.', 200.00, 'San Francisco, CA', NULL, 2, 11, true, false, 56, NOW() - INTERVAL '5 days'),
('Mexican Spice Blend Set 12-piece', 'Authentic recipes, sealed packaging. Great gift.', 35.00, 'Houston, TX', NULL, 5, 11, true, false, 23, NOW() - INTERVAL '6 days'),

-- Beauty & Cosmetics (category_id=17) — 6 listings
('La Mer Moisturizing Cream 2oz', 'Sealed, original box. Best by 2027.', 250.00, 'Beverly Hills, CA', NULL, 2, 17, true, false, 67, NOW() - INTERVAL '1 day'),
('Dyson Airwrap Complete', 'Open box, never used. All attachments included.', 480.00, 'New York, NY', NULL, 1, 17, true, false, 145, NOW() - INTERVAL '2 days'),
('Olaplex Hair Treatment Set No.0-8', 'All 8 products, sealed. Salon-fresh stock.', 280.00, 'Miami, FL', NULL, 3, 17, true, false, 89, NOW() - INTERVAL '3 days'),
('Charlotte Tilbury Makeup Bundle', 'Pillow Talk lipsticks x3, Magic Cream, Hollywood Flawless Filter.', 195.00, 'Los Angeles, CA', NULL, 2, 17, true, false, 56, NOW() - INTERVAL '4 days'),
('NuFACE Trinity Facial Toning Device', 'With all attachments and gel primer. Excellent condition.', 220.00, 'Phoenix, AZ', NULL, 3, 17, true, false, 78, NOW() - INTERVAL '5 days'),
('Drunk Elephant Skincare Set Complete', '8 products, all sealed. Retail $480.', 320.00, 'Atlanta, GA', NULL, 5, 17, true, false, 45, NOW() - INTERVAL '6 days'),

-- Business & Services (category_id=12) — 6 listings
('Professional Photography — Weddings', '8 hours coverage, edited gallery, second shooter optional. $2500-4000.', 3200.00, 'New York, NY', NULL, 1, 12, true, false, 234, NOW() - INTERVAL '1 day'),
('CPA Tax Preparation Services', 'Personal + small business. 15 years experience. Flat fees.', 450.00, 'Chicago, IL', NULL, 4, 12, true, false, 89, NOW() - INTERVAL '2 days'),
('House Cleaning Service Weekly', 'Eco-friendly products, insured, 4-person team. $150-250/visit.', 175.00, 'Los Angeles, CA', NULL, 2, 12, true, false, 145, NOW() - INTERVAL '3 days'),
('Personal Training Sessions Pack 10', 'Certified trainer, gym or home. Strength, weight loss, nutrition.', 800.00, 'Miami, FL', NULL, 3, 12, true, false, 56, NOW() - INTERVAL '4 days'),
('Dog Walking Service Daily', '30-60 min walks, GPS tracking, photo updates. $25-40/walk.', 30.00, 'Austin, TX', NULL, 5, 12, true, false, 78, NOW() - INTERVAL '5 days'),
('Web Development Agency Hire', 'Full-stack team, React/Node, e-commerce specialty. Hourly or project.', 5000.00, 'Boston, MA', NULL, 1, 12, true, false, 167, NOW() - INTERVAL '6 days'),

-- Housing/Rental (category_id=20) — 8 listings
('Short Term Furnished Studio Manhattan', 'Monthly furnished rental, all utilities + WiFi. 1-month min.', 3500.00, 'New York, NY', '500 sqft', 1, 20, true, false, 234, NOW() - INTERVAL '1 day'),
('Room for Rent Brooklyn House', 'Private room + bathroom, shared kitchen. Female only.', 1200.00, 'New York, NY', '150 sqft', 1, 20, true, false, 145, NOW() - INTERVAL '2 days'),
('Vacation Rental Lake Tahoe', 'Sleeps 10, hot tub, ski-in/ski-out. Weekly rentals.', 4500.00, 'Lake Tahoe, CA', '2800 sqft', 2, 20, true, false, 345, NOW() - INTERVAL '3 days'),
('Sublet 3 months Miami Beach', 'Furnished 1BR with ocean view. June-August. Pet-friendly.', 3200.00, 'Miami, FL', '750 sqft', 3, 20, true, false, 234, NOW() - INTERVAL '4 days'),
('Roommate Wanted Austin', 'Master suite in 3BR house. Pool, garage parking. $850/mo.', 850.00, 'Austin, TX', '300 sqft', 5, 20, true, false, 89, NOW() - INTERVAL '5 days'),
('Corporate Housing Chicago Downtown', 'Fully furnished 2BR, monthly rentals for business travelers.', 4800.00, 'Chicago, IL', '1100 sqft', 4, 20, true, false, 56, NOW() - INTERVAL '6 days'),
('Airbnb Style Cabin Asheville', 'Mountain views, fireplace, hot tub. Weekend rentals available.', 350.00, 'Asheville, NC', '900 sqft', 1, 20, true, false, 178, NOW() - INTERVAL '7 days'),
('Beachfront Bungalow Key West', 'Direct beach access, 2BR, weekly rentals. Pet-friendly.', 2400.00, 'Key West, FL', '1000 sqft', 3, 20, true, false, 234, NOW() - INTERVAL '8 days');
