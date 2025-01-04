-- Create clinical_notes table
CREATE TABLE IF NOT EXISTS clinical_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('voice', 'manual')),
    tags TEXT[] DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Add RLS policies
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;

-- Policy for inserting notes (providers only)
CREATE POLICY "Providers can insert clinical notes" ON clinical_notes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('provider', 'admin')
            AND users.organization_id = clinical_notes.organization_id
        )
    );

-- Policy for viewing notes (organization members only)
CREATE POLICY "Organization members can view clinical notes" ON clinical_notes
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.organization_id = clinical_notes.organization_id
        )
    );

-- Policy for updating notes (providers only, their own notes)
CREATE POLICY "Providers can update their own clinical notes" ON clinical_notes
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('provider', 'admin')
            AND users.organization_id = clinical_notes.organization_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('provider', 'admin')
            AND users.organization_id = clinical_notes.organization_id
        )
    );

-- Policy for deleting notes (providers only, their own notes)
CREATE POLICY "Providers can delete their own clinical notes" ON clinical_notes
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('provider', 'admin')
            AND users.organization_id = clinical_notes.organization_id
            AND (users.id = clinical_notes.provider_id OR users.role = 'admin')
        )
    );

-- Create index for faster queries
CREATE INDEX clinical_notes_patient_id_idx ON clinical_notes(patient_id);
CREATE INDEX clinical_notes_provider_id_idx ON clinical_notes(provider_id);
CREATE INDEX clinical_notes_organization_id_idx ON clinical_notes(organization_id);
CREATE INDEX clinical_notes_recorded_at_idx ON clinical_notes(recorded_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_clinical_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_clinical_notes_updated_at
    BEFORE UPDATE ON clinical_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_clinical_notes_updated_at();
