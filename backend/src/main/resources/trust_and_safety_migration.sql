-- Trust & Safety Migration
-- Add status column to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);

-- Create listing_flags table
CREATE TABLE IF NOT EXISTS listing_flags (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'OPEN' NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(255),
    UNIQUE(listing_id, user_id)
);

CREATE INDEX idx_listing_flags_listing_id ON listing_flags(listing_id);
CREATE INDEX idx_listing_flags_status ON listing_flags(status);

-- Create keyword_filters table
CREATE TABLE IF NOT EXISTS keyword_filters (
    id SERIAL PRIMARY KEY,
    word VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    severity INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_keyword_filters_word ON keyword_filters(word);
CREATE INDEX idx_keyword_filters_active ON keyword_filters(active);

-- Insert default spam keywords
INSERT INTO keyword_filters (word, category, severity, active)
VALUES 
    ('free money', 'SPAM', 2, TRUE),
    ('click here', 'SPAM', 2, TRUE),
    ('earn quick', 'SPAM', 2, TRUE),
    ('bitcoin', 'SPAM', 2, TRUE),
    ('forex', 'SPAM', 2, TRUE),
    ('gun', 'PROHIBITED_ITEM', 3, TRUE),
    ('firearm', 'PROHIBITED_ITEM', 3, TRUE),
    ('drug', 'PROHIBITED_ITEM', 3, TRUE),
    ('cocaine', 'PROHIBITED_ITEM', 3, TRUE),
    ('fake id', 'PROHIBITED_ITEM', 3, TRUE)
ON CONFLICT (word) DO NOTHING;
