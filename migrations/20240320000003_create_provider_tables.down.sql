-- Drop triggers
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;

-- Drop indexes
DROP INDEX IF EXISTS idx_appointments_date;
DROP INDEX IF EXISTS idx_appointments_patient;
DROP INDEX IF EXISTS idx_appointments_provider;
DROP INDEX IF EXISTS idx_vital_signs_appointment;
DROP INDEX IF EXISTS idx_symptoms_appointment;

-- Drop tables in correct order
DROP TABLE IF EXISTS symptoms;
DROP TABLE IF EXISTS vital_signs;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS providers;
