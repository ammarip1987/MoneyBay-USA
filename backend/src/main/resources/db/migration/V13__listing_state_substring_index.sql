-- Отбор по штату записан через SUBSTRING: в JPQL нет right(), а перевод запроса
-- на родной SQL отнял бы сортировку из Pageable.
--
-- Индекс V11 построен на right(location, 2), и планировщик не сводит к нему
-- substring — при отборе по разделу и штату вместе он читал таблицу целиком,
-- пять секунд. Здесь индекс на само выражение из запроса.
CREATE INDEX IF NOT EXISTS idx_listings_state_substr
    ON listings (substring(location, length(location) - 1, 2))
    WHERE is_active AND NOT is_deleted AND location IS NOT NULL;
