-- Отбор по штату идёт по концу строки location («Delano, CA»): отдельного
-- столбца под штат нет. Обычный индекс по location для сравнения с концом строки
-- не годится, поэтому индексируется вычисленный код штата.
--
-- Без него отбор по штату читал бы все объявления: в них 4335 разных мест.
CREATE INDEX IF NOT EXISTS idx_listings_state
    ON listings (right(location, 2))
    WHERE is_active AND NOT is_deleted AND location IS NOT NULL;
