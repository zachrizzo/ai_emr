-- Drop triggers
DROP TRIGGER IF EXISTS update_insurances_updated_at ON insurances;

-- Drop indexes
DROP INDEX IF EXISTS idx_patients_full_name;
DROP INDEX IF EXISTS idx_medical_history_patient;
DROP INDEX IF EXISTS idx_medications_patient;
DROP INDEX IF EXISTS idx_emergency_contacts_patient;

-- Drop tables in correct order
DROP TABLE IF EXISTS lifestyle;
DROP TABLE IF EXISTS medications;
DROP TABLE IF EXISTS medical_history;
DROP TABLE IF EXISTS insurances;
DROP TABLE IF EXISTS emergency_contacts;
DROP TABLE IF EXISTS patients;
