-- Create Clinical Notes Tables
CREATE TABLE clinical_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id),
    provider_id UUID REFERENCES providers(id),
    appointment_id UUID REFERENCES appointments(id),
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'voice', 'manual', 'template'
    specialty VARCHAR(100),
    template_type VARCHAR(100),
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    organization_id UUID REFERENCES organizations(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE note_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_default BOOLEAN DEFAULT false,
    tags TEXT[],
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    organization_id UUID REFERENCES organizations(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE template_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES note_templates(id),
    content TEXT NOT NULL,
    version INTEGER NOT NULL,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    organization_id UUID REFERENCES organizations(id)
);

CREATE TABLE note_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID REFERENCES clinical_notes(id),
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    organization_id UUID REFERENCES organizations(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE note_collaborators (
    note_id UUID REFERENCES clinical_notes(id),
    user_id UUID REFERENCES users(id),
    role VARCHAR(50) NOT NULL, -- 'viewer', 'editor', 'reviewer'
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    added_by UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    PRIMARY KEY (note_id, user_id)
);

CREATE TABLE note_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID REFERENCES clinical_notes(id),
    content TEXT NOT NULL,
    changed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    organization_id UUID REFERENCES organizations(id)
);

-- Create indexes
CREATE INDEX idx_clinical_notes_patient ON clinical_notes(patient_id);
CREATE INDEX idx_clinical_notes_provider ON clinical_notes(provider_id);
CREATE INDEX idx_clinical_notes_appointment ON clinical_notes(appointment_id);
CREATE INDEX idx_note_templates_specialty ON note_templates(specialty);
CREATE INDEX idx_template_versions_template ON template_versions(template_id);
CREATE INDEX idx_note_comments_note ON note_comments(note_id);
CREATE INDEX idx_note_history_note ON note_history(note_id);

-- Create triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clinical_notes_updated_at
    BEFORE UPDATE ON clinical_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_note_templates_updated_at
    BEFORE UPDATE ON note_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_note_comments_updated_at
    BEFORE UPDATE ON note_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
