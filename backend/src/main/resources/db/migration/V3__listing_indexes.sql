-- Индексы для ленты объявлений.
--
-- До этого на таблице был только первичный ключ: выборка любой страницы читала
-- её целиком и сортировала в памяти — 4371 блок ради 16 строк.
--
-- Частичные индексы (WHERE is_active AND NOT is_deleted): лента всегда просит
-- только видимые объявления, поэтому скрытые в индекс не попадают и он выходит
-- заметно меньше.

-- Главная: сортировка по дате без фильтров
CREATE INDEX IF NOT EXISTS idx_listings_active_created
  ON listings (created_at DESC)
  WHERE is_active AND NOT is_deleted;

-- Страница категории: отбор по категории, затем сортировка
CREATE INDEX IF NOT EXISTS idx_listings_category_created
  ON listings (category_id, created_at DESC)
  WHERE is_active AND NOT is_deleted;

-- Фильтр по городу и подборка «похожие в этом городе»
CREATE INDEX IF NOT EXISTS idx_listings_location_created
  ON listings (location, created_at DESC)
  WHERE is_active AND NOT is_deleted;

-- Фильтр по цене и подборка «похожие по цене»
CREATE INDEX IF NOT EXISTS idx_listings_price
  ON listings (price)
  WHERE is_active AND NOT is_deleted;

-- «Мои объявления» и подборка «ещё от продавца»
CREATE INDEX IF NOT EXISTS idx_listings_user_created
  ON listings (user_id, created_at DESC)
  WHERE NOT is_deleted;

-- Внешний ключ без индекса: удаление объявления искало записи полным просмотром
CREATE INDEX IF NOT EXISTS idx_listing_images_listing
  ON listing_images (listing_id);
