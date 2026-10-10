-- Указатель под расчёт отбора: min, max, avg и распределение цен.
--
-- Запросы priceStats и priceBuckets считают по всем объявлениям категории.
-- Указатель idx_listings_category_created покрывает отбор по категории, но не
-- содержит цену — база читала каждую строку таблицы, чтобы взять price. На
-- категории с сотнями тысяч объявлений /api/listings/facets шёл тринадцать
-- секунд и задерживал всю страницу раздела.
--
-- price вынесен в INCLUDE: он не участвует в поиске, только возвращается.
-- Так расчёт идёт по одному указателю, не трогая таблицу.
--
-- Условие WHERE то же, что в запросах: частичный указатель меньше полного и
-- не хранит снятые объявления.
CREATE INDEX IF NOT EXISTS idx_listings_category_price
    ON listings (category_id)
    INCLUDE (price)
    WHERE is_active AND NOT is_deleted;

-- То же для отбора по городу: запросы принимают city и category порознь.
CREATE INDEX IF NOT EXISTS idx_listings_location_price
    ON listings (location)
    INCLUDE (price)
    WHERE is_active AND NOT is_deleted;
