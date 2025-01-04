-- Drop triggers
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;

-- Drop indexes
DROP INDEX IF EXISTS idx_audit_logs_timestamp;
DROP INDEX IF EXISTS idx_audit_logs_user;
DROP INDEX IF EXISTS idx_activity_logs_user;
DROP INDEX IF EXISTS idx_activity_logs_timestamp;
DROP INDEX IF EXISTS idx_role_audit_logs_role;
DROP INDEX IF EXISTS idx_data_transfer_logs_user;

-- Drop tables in correct order
DROP TABLE IF EXISTS backups;
DROP TABLE IF EXISTS data_transfer_logs;
DROP TABLE IF EXISTS role_audit_logs;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS system_settings;
