-- Drop triggers first
DROP TRIGGER IF EXISTS update_clinical_notes_updated_at ON clinical_notes;
DROP TRIGGER IF EXISTS update_note_templates_updated_at ON note_templates;
DROP TRIGGER IF EXISTS update_note_comments_updated_at ON note_comments;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_clinical_notes_patient;
DROP INDEX IF EXISTS idx_clinical_notes_provider;
DROP INDEX IF EXISTS idx_clinical_notes_appointment;
DROP INDEX IF EXISTS idx_note_templates_specialty;
DROP INDEX IF EXISTS idx_template_versions_template;
DROP INDEX IF EXISTS idx_note_comments_note;
DROP INDEX IF EXISTS idx_note_history_note;

-- Drop tables in correct order to handle dependencies
DROP TABLE IF EXISTS note_history;
DROP TABLE IF EXISTS note_collaborators;
DROP TABLE IF EXISTS note_comments;
DROP TABLE IF EXISTS template_versions;
DROP TABLE IF EXISTS note_templates;
DROP TABLE IF EXISTS clinical_notes;
