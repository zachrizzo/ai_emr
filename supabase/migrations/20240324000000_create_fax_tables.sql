-- Create enum for fax status
CREATE TYPE fax_status AS ENUM ('queued', 'sending', 'sent', 'failed', 'received');

-- Create table for fax records
CREATE TABLE faxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    patient_id UUID REFERENCES patients(id),
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    status fax_status NOT NULL DEFAULT 'queued',
    from_number TEXT NOT NULL,
    to_number TEXT NOT NULL,
    media_url TEXT,
    srfax_id TEXT,
    pages INTEGER,
    duration INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Create RLS policies
ALTER TABLE faxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's faxes"
    ON faxes FOR SELECT
    USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "Users can insert faxes for their organization"
    ON faxes FOR INSERT
    WITH CHECK (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "Users can update their organization's faxes"
    ON faxes FOR UPDATE
    USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Create indexes
CREATE INDEX faxes_organization_id_idx ON faxes(organization_id);
CREATE INDEX faxes_patient_id_idx ON faxes(patient_id);
CREATE INDEX faxes_created_at_idx ON faxes(created_at);
CREATE INDEX faxes_srfax_id_idx ON faxes(srfax_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_faxes_updated_at
    BEFORE UPDATE ON faxes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
