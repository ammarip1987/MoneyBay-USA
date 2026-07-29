-- Insert 5 test listings
INSERT INTO listings (title, description, price, location, area, views, is_active, is_featured, is_deleted, created_at, updated_at, user_id, category_id)
SELECT
    'iPhone 14 Pro - Excellent condition',
    'Barely used iPhone 14 Pro, 256GB. Comes with original box and accessories. No scratches. Perfect condition.',
    800.00,
    (SELECT name FROM cities ORDER BY id LIMIT 1),
    'Downtown',
    0,
    true,
    false,
    false,
    NOW(),
    NOW(),
    (SELECT id FROM users ORDER BY id LIMIT 1),
    (SELECT id FROM categories ORDER BY id LIMIT 1)
WHERE EXISTS (SELECT 1 FROM users) AND EXISTS (SELECT 1 FROM categories);

INSERT INTO listings (title, description, price, location, area, views, is_active, is_featured, is_deleted, created_at, updated_at, user_id, category_id)
SELECT
    'Mountain bike Trek X-Caliber',
    'Trek X-Caliber mountain bike, 27.5 inch wheels, excellent for trails. Well maintained, new tires.',
    450.00,
    (SELECT name FROM cities ORDER BY id LIMIT 1),
    'Midtown',
    0,
    true,
    false,
    false,
    NOW(),
    NOW(),
    (SELECT id FROM users ORDER BY id LIMIT 1),
    (SELECT id FROM categories ORDER BY id OFFSET 1 LIMIT 1)
WHERE EXISTS (SELECT 1 FROM users) AND EXISTS (SELECT 1 FROM categories OFFSET 1);

INSERT INTO listings (title, description, price, location, area, views, is_active, is_featured, is_deleted, created_at, updated_at, user_id, category_id)
SELECT
    'Vintage wooden table - 1970s',
    'Beautiful vintage wooden table from the 1970s. Great condition. Perfect for dining room. Must see.',
    250.00,
    (SELECT name FROM cities ORDER BY id LIMIT 1),
    'Uptown',
    0,
    true,
    false,
    false,
    NOW(),
    NOW(),
    (SELECT id FROM users ORDER BY id LIMIT 1),
    (SELECT id FROM categories ORDER BY id OFFSET 2 LIMIT 1)
WHERE EXISTS (SELECT 1 FROM users) AND EXISTS (SELECT 1 FROM categories OFFSET 2);

INSERT INTO listings (title, description, price, location, area, views, is_active, is_featured, is_deleted, created_at, updated_at, user_id, category_id)
SELECT
    'Gaming PC RTX 4070 - High Performance',
    'High-end gaming PC with RTX 4070, Intel i7-13700K, 32GB RAM, 1TB NVMe SSD. Perfect for gaming and 4K streaming.',
    1500.00,
    (SELECT name FROM cities ORDER BY id LIMIT 1),
    'Tech District',
    0,
    true,
    false,
    false,
    NOW(),
    NOW(),
    (SELECT id FROM users ORDER BY id LIMIT 1),
    (SELECT id FROM categories ORDER BY id OFFSET 3 LIMIT 1)
WHERE EXISTS (SELECT 1 FROM users) AND EXISTS (SELECT 1 FROM categories OFFSET 3);

INSERT INTO listings (title, description, price, location, area, views, is_active, is_featured, is_deleted, created_at, updated_at, user_id, category_id)
SELECT
    'Apartment for rent - Downtown 2BR/2BA',
    '2 Bedroom, 2 Bathroom apartment in downtown, close to metro, parking included. Pet friendly. Modern appliances.',
    2000.00,
    (SELECT name FROM cities ORDER BY id LIMIT 1),
    'Central District',
    0,
    true,
    false,
    false,
    NOW(),
    NOW(),
    (SELECT id FROM users ORDER BY id LIMIT 1),
    (SELECT id FROM categories ORDER BY id OFFSET 4 LIMIT 1)
WHERE EXISTS (SELECT 1 FROM users) AND EXISTS (SELECT 1 FROM categories OFFSET 4);
