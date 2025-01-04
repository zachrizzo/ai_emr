-- Document Templates Table
CREATE TABLE document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB NOT NULL,
    tags TEXT[],
    version INTEGER DEFAULT 1 NOT NULL,
    created_by UUID,
    last_updated_by UUID,
    organization_id UUID REFERENCES organizations(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Assigned Documents Table
CREATE TABLE assigned_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'utc'),
    deleted_at TIMESTAMP WITH TIME ZONE,
    organization_id UUID REFERENCES organizations(id),
    document_template_id UUID REFERENCES document_templates(id),
    patient_id UUID REFERENCES patients(id),
    is_visible_on_portal BOOLEAN DEFAULT true,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'utc'),
    due_at TIMESTAMP WITHOUT TIME ZONE
);

-- Form Submissions Table
CREATE TABLE form_submissions (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'utc'),
    deleted_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    form_data JSONB,
    form_id UUID REFERENCES document_templates(id),
    assigned_form_id UUID REFERENCES assigned_documents(id),
    organization_id UUID REFERENCES organizations(id),
    patient_id UUID REFERENCES patients(id),
    status TEXT
);

-- Create indexes
CREATE INDEX idx_document_templates_org ON document_templates(organization_id);
CREATE INDEX idx_assigned_documents_patient ON assigned_documents(patient_id);
CREATE INDEX idx_form_submissions_patient ON form_submissions(patient_id);

-- Create triggers
CREATE TRIGGER update_document_templates_updated_at
    BEFORE UPDATE ON document_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
