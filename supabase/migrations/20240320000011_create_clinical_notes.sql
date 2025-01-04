-- Clinical Notes System

-- Note Templates Table
CREATE TABLE note_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    specialty VARCHAR(255),
    category VARCHAR(255),
    organization_id UUID REFERENCES organizations(id),
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Clinical Notes Table
CREATE TABLE clinical_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) NOT NULL,
    provider_id UUID REFERENCES users(id) NOT NULL,
    appointment_id UUID REFERENCES appointments(id),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    content JSONB NOT NULL, -- Stores rich text content
    type VARCHAR(50) NOT NULL, -- 'voice', 'manual', 'template', 'ai_assisted'
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'final', 'signed', 'amended'
    version INTEGER DEFAULT 1,
    parent_note_id UUID REFERENCES clinical_notes(id), -- For amendments/versions
    template_id UUID REFERENCES note_templates(id),
    metadata JSONB, -- Flexible metadata storage
    tags TEXT[],
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    signed_at TIMESTAMP WITH TIME ZONE,
    signed_by UUID REFERENCES users(id)
);

-- Note Sections Table (for structured note content)
CREATE TABLE note_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID REFERENCES clinical_notes(id) NOT NULL,
    section_type VARCHAR(100) NOT NULL, -- 'subjective', 'objective', 'assessment', 'plan', 'custom'
    title VARCHAR(255),
    content JSONB NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Voice Recordings Table
CREATE TABLE voice_recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID REFERENCES clinical_notes(id) NOT NULL,
    file_path TEXT NOT NULL,
    duration INTEGER, -- in seconds
    transcription TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'error'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Note Attachments Table
CREATE TABLE note_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID REFERENCES clinical_notes(id) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Note Access History Table
CREATE TABLE note_access_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID REFERENCES clinical_notes(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'view', 'edit', 'sign', 'print', 'share'
    ip_address VARCHAR(45),
    user_agent TEXT,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Note Comments Table
CREATE TABLE note_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID REFERENCES clinical_notes(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES note_comments(id),
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI Assistance History Table
CREATE TABLE note_ai_assistance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID REFERENCES clinical_notes(id) NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    model_version VARCHAR(100),
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX idx_clinical_notes_patient ON clinical_notes(patient_id);
CREATE INDEX idx_clinical_notes_provider ON clinical_notes(provider_id);
CREATE INDEX idx_clinical_notes_appointment ON clinical_notes(appointment_id);
CREATE INDEX idx_clinical_notes_created ON clinical_notes(created_at);
CREATE INDEX idx_note_sections_note ON note_sections(note_id);
CREATE INDEX idx_voice_recordings_note ON voice_recordings(note_id);
CREATE INDEX idx_note_access_history_note ON note_access_history(note_id);
CREATE INDEX idx_note_comments_note ON note_comments(note_id);

-- Triggers for updated_at
CREATE TRIGGER update_clinical_notes_updated_at
    BEFORE UPDATE ON clinical_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_note_sections_updated_at
    BEFORE UPDATE ON note_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_recordings_updated_at
    BEFORE UPDATE ON voice_recordings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_note_comments_updated_at
    BEFORE UPDATE ON note_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_access_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_ai_assistance ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (these should be refined based on specific access control requirements)
CREATE POLICY "Users can view notes within their organization" ON clinical_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE user_id = auth.uid()
            AND organization_id = clinical_notes.organization_id
        )
    );

CREATE POLICY "Providers can create notes" ON clinical_notes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE user_id = auth.uid()
            AND organization_id = clinical_notes.organization_id
            AND role IN ('provider', 'admin')
        )
    );

CREATE POLICY "Note owners can update their notes" ON clinical_notes
    FOR UPDATE USING (
        provider_id = auth.uid()
        AND status != 'signed'
        AND EXISTS (
            SELECT 1 FROM organization_members
            WHERE user_id = auth.uid()
            AND organization_id = clinical_notes.organization_id
        )
    );
