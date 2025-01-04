-- Languages Table
CREATE TABLE languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL,
    name VARCHAR(50) NOT NULL
);

-- Translations Table
CREATE TABLE translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id UUID REFERENCES languages(id),
    key VARCHAR(255) NOT NULL,
    value TEXT NOT NULL
);

-- Create indexes
CREATE INDEX idx_translations_language ON translations(language_id);
CREATE INDEX idx_translations_key ON translations(key);

-- Insert default language
INSERT INTO languages (code, name) VALUES ('en', 'English');
