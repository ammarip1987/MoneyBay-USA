-- Витрина продавца. Правовых сведений здесь нет: EIN, юридический адрес и
-- банковский счёт собирает Stripe на своей стороне, площадка хранит только
-- идентификатор учётной записи и состояние проверки.
CREATE TABLE IF NOT EXISTS storefronts (
  id                  BIGSERIAL PRIMARY KEY,
  user_id             BIGINT NOT NULL UNIQUE REFERENCES users(id),
  name                VARCHAR(255) NOT NULL,
  slug                VARCHAR(255) NOT NULL UNIQUE,
  about               VARCHAR(2000),
  logo_url            VARCHAR(255),
  banner_url          VARCHAR(255),
  location            VARCHAR(255),
  phones              VARCHAR(500),
  website             VARCHAR(255),
  hours               VARCHAR(500),
  is_published        BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_account_id   VARCHAR(255),
  verification_status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
  payouts_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_storefronts_slug ON storefronts (slug);
