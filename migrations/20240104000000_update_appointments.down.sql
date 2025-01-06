-- Revert columns
ALTER TABLE appointments
DROP COLUMN IF EXISTS is_recurring,
DROP COLUMN IF EXISTS recurring_pattern,
DROP COLUMN IF EXISTS visit_type,
ALTER COLUMN status TYPE character varying,
ALTER COLUMN appointment_type TYPE character varying;

-- Drop enums
DROP TYPE IF EXISTS appointment_visit_type;
DROP TYPE IF EXISTS appointment_status;
