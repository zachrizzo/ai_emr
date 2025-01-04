-- Drop indexes
DROP INDEX IF EXISTS idx_translations_language;
DROP INDEX IF EXISTS idx_translations_key;

-- Drop tables in correct order
DROP TABLE IF EXISTS translations;
DROP TABLE IF EXISTS languages;
