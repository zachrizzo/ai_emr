-- Drop existing tables if they exist
DROP TABLE IF EXISTS medications;
DROP TABLE IF EXISTS immunizations;

-- Create medications table
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    prescribed_by UUID NOT NULL REFERENCES users(id)
);

-- Create immunizations table
CREATE TABLE immunizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    vaccine_name VARCHAR(255) NOT NULL,
    date_administered TIMESTAMP WITH TIME ZONE NOT NULL,
    provider VARCHAR(255) NOT NULL,
    lot_number VARCHAR(100),
    expiration_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    administered_by UUID NOT NULL REFERENCES users(id)
);

-- Add indexes for common queries
CREATE INDEX idx_medications_patient ON medications(patient_id);
CREATE INDEX idx_medications_org ON medications(organization_id);
CREATE INDEX idx_immunizations_patient ON immunizations(patient_id);
CREATE INDEX idx_immunizations_org ON immunizations(organization_id);

-- Add triggers to update updated_at timestamp
CREATE TRIGGER update_medications_updated_at
    BEFORE UPDATE ON medications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_immunizations_updated_at
    BEFORE UPDATE ON immunizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Explicitly disable RLS for both tables
ALTER TABLE medications DISABLE ROW LEVEL SECURITY;
ALTER TABLE immunizations DISABLE ROW LEVEL SECURITY;
