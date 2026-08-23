-- Поиск по подстроке LIKE '%слово%' не ложится на индекс: база читает все
-- объявления и в каждом ищет вхождение по заголовку и описанию. На 1.2 млн
-- записей запрос шёл дольше десяти минут — поиск по «house» не отвечал вовсе.
--
-- Полнотекстовый поиск раскладывает текст на слова заранее и ищет по индексу.
-- Заодно находит словоформы: «houses» и «housing» по запросу «house».
CREATE INDEX IF NOT EXISTS idx_listings_search
    ON listings
    USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- Подсказки при вводе ищут по началу заголовка. Обычный индекс по нему для
-- LIKE 'слово%' не годится: сравнение идёт по правилам языка, а не побайтно.
-- text_pattern_ops это меняет.
CREATE INDEX IF NOT EXISTS idx_listings_title_prefix
    ON listings (lower(title) text_pattern_ops)
    WHERE is_active AND NOT is_deleted;
