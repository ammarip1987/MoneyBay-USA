-- Показывать ли фотографию из социальной сети. На production ddl-auto=validate,
-- поэтому столбцы добавляются миграциями, иначе задача не запускается.
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_avatar BOOLEAN NOT NULL DEFAULT TRUE;
