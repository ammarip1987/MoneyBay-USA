-- Подкатегория у объявления.
--
-- Справочник подкатегорий существовал с первой схемы, панель каталога их
-- показывала и строила ссылки вида ?category=cosmetics&subcategory=makeup, но
-- объявления с подкатегориями связаны не были: отбирать было нечем, и нажатие
-- на подкатегорию открывало всю категорию.
--
-- Поле необязательное: прежние объявления заводились без подкатегории, и
-- требовать её у них нельзя. Новые тоже могут обходиться без неё — не у всех
-- категорий справочник заполнен.
ALTER TABLE listings
    ADD COLUMN IF NOT EXISTS subcategory_id BIGINT;

ALTER TABLE listings
    ADD CONSTRAINT fk_listings_subcategory
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id);

-- Указатель под отбор: те же условия, что в запросах ленты, и created_at для
-- порядка выдачи. Частичный — снятые объявления в выдачу не идут.
CREATE INDEX IF NOT EXISTS idx_listings_subcategory_created
    ON listings (subcategory_id, created_at DESC)
    WHERE is_active AND NOT is_deleted;
