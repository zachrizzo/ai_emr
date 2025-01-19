-- Create vitals table
CREATE TABLE IF NOT EXISTS vitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    clinical_note_id UUID REFERENCES clinical_notes(id) ON DELETE SET NULL,
    temperature DECIMAL(4,1),
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    heart_rate INTEGER,
    respiratory_rate INTEGER,
    oxygen_saturation INTEGER,
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    bmi DECIMAL(4,1),
    pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    -- Add constraints for valid ranges
    CONSTRAINT valid_temperature CHECK (temperature >= 90 AND temperature <= 110),
    CONSTRAINT valid_blood_pressure_systolic CHECK (blood_pressure_systolic >= 60 AND blood_pressure_systolic <= 250),
    CONSTRAINT valid_blood_pressure_diastolic CHECK (blood_pressure_diastolic >= 40 AND blood_pressure_diastolic <= 150),
    CONSTRAINT valid_heart_rate CHECK (heart_rate >= 30 AND heart_rate <= 250),
    CONSTRAINT valid_respiratory_rate CHECK (respiratory_rate >= 8 AND respiratory_rate <= 60),
    CONSTRAINT valid_oxygen_saturation CHECK (oxygen_saturation >= 0 AND oxygen_saturation <= 100),
    CONSTRAINT valid_height CHECK (height > 0 AND height <= 300),
    CONSTRAINT valid_weight CHECK (weight > 0 AND weight <= 700)
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_vitals_patient_id ON vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_vitals_appointment_id ON vitals(appointment_id);
CREATE INDEX IF NOT EXISTS idx_vitals_clinical_note_id ON vitals(clinical_note_id);
CREATE INDEX IF NOT EXISTS idx_vitals_created_at ON vitals(created_at);
CREATE INDEX IF NOT EXISTS idx_vitals_organization_id ON vitals(organization_id);


-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_vitals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vitals_updated_at
    BEFORE UPDATE ON vitals
    FOR EACH ROW
    EXECUTE FUNCTION update_vitals_updated_at();
