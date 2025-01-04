-- Drop triggers
DROP TRIGGER IF EXISTS update_document_templates_updated_at ON document_templates;

-- Drop indexes
DROP INDEX IF EXISTS idx_document_templates_org;
DROP INDEX IF EXISTS idx_assigned_documents_patient;
DROP INDEX IF EXISTS idx_form_submissions_patient;

-- Drop tables in correct order
DROP TABLE IF EXISTS form_submissions;
DROP TABLE IF EXISTS assigned_documents;
DROP TABLE IF EXISTS document_templates;
