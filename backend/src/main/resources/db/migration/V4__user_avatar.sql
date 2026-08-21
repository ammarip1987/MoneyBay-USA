-- Аватар пользователя: имя файла в хранилище R2.
-- На production ddl-auto=validate, поэтому столбцы добавляются миграциями, а не
-- Hibernate: без этого задача не запускается вовсе — проверка схемы падает.
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255);
