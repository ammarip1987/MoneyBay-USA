-- Ограничение на listings.status осталось от прежней схемы: в нём шесть
-- значений, а перечисление в коде знает семь. Объявление, отклонённое
-- проверкой, получало REJECTED — база такую запись отвергала, и подача
-- отказывала с кодом 500.
--
-- Ограничение снимается и заводится заново со всеми семью значениями.
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_status_check;

ALTER TABLE listings ADD CONSTRAINT listings_status_check
    CHECK (status IN ('ACTIVE', 'HIDDEN', 'FLAGGED', 'BANNED',
                      'REJECTED', 'EXPIRED', 'DELETED'));
