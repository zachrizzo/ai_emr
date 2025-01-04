-- Drop triggers
DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
DROP TRIGGER IF EXISTS update_two_factor_auth_updated_at ON two_factor_auth;

-- Drop indexes
DROP INDEX IF EXISTS idx_api_keys_user;
DROP INDEX IF EXISTS idx_user_sessions_user;
DROP INDEX IF EXISTS idx_user_sessions_token;
DROP INDEX IF EXISTS idx_two_factor_auth_user;
DROP INDEX IF EXISTS idx_password_reset_tokens_user;
DROP INDEX IF EXISTS idx_password_reset_tokens_token;

-- Drop tables in correct order
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS two_factor_auth;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS api_keys;
