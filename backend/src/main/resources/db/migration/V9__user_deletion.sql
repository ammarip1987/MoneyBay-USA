-- Отложенное закрытие учётной записи: месяц данные держатся, потом стираются.
-- Срок даёт вернуться, если закрытие вышло по ошибке или учётную запись закрыл
-- не владелец.
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMPTZ;

-- Отбор просроченных идёт раз в сутки по этому столбцу
CREATE INDEX IF NOT EXISTS idx_users_deletion_scheduled
    ON users (deletion_scheduled_at)
    WHERE deletion_scheduled_at IS NOT NULL;
