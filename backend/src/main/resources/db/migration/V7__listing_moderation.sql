-- Причины отклонения при проверке. Объявление не удаляется: остаётся у автора,
-- окно показывает, что поправить, после правки проверка проходит заново.
ALTER TABLE listings ADD COLUMN IF NOT EXISTS moderation_reasons VARCHAR(500);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS moderation_note VARCHAR(1000);
