-- Отбор продвинутых объявлений без индекса читал таблицу целиком: на 1.44 млн
-- записей это Parallel Seq Scan и пять секунд, из-за чего лента отвечала шесть.
-- Индекс частичный: продвинутых единицы, остальные строки в него не входят.
CREATE INDEX IF NOT EXISTS idx_listings_promoted
    ON listings (promoted_until DESC)
    WHERE is_active AND NOT is_deleted AND promoted_until IS NOT NULL;
