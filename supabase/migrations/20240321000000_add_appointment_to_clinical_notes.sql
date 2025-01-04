-- Add appointment_id to clinical_notes table
ALTER TABLE clinical_notes
ADD COLUMN appointment_id UUID REFERENCES appointments(id);

-- Add index for better query performance
CREATE INDEX idx_clinical_notes_appointment ON clinical_notes(appointment_id);
