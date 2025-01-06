-- Patients Table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(50),
    address TEXT,
    phone_number VARCHAR(15),
    email VARCHAR(255),
    preferred_language VARCHAR(50),
    preferred_communication VARCHAR(50),
    cultural_considerations TEXT,
    organization_id UUID REFERENCES organizations(id),
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'utc')
);

-- Emergency Contacts Table
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id),
    name VARCHAR(255),
    relationship VARCHAR(100),
    phone_number VARCHAR(15),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'utc'),
    last_updated_by UUID DEFAULT auth.uid(),
    organization_id UUID REFERENCES organizations(id)
);

-- Insurance Table
CREATE TABLE insurances (
    id BIGINT PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) NOT NULL,
    provider_name TEXT NOT NULL,
    policy_number TEXT NOT NULL,
    coverage_details JSONB,
    expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    created_by UUID REFERENCES users(id) NOT NULL
);

-- Medical History Table
CREATE TABLE medical_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id),
    condition_name VARCHAR(255),
    condition_type VARCHAR(50),
    severity VARCHAR(50),
    onset_date DATE,
    resolution_date DATE,
    is_active BOOLEAN DEFAULT true,
    family_member VARCHAR(100),
    notes TEXT,
    date_recorded DATE DEFAULT now()
);

-- Medications Table
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id),
    medication_name VARCHAR(255),
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    start_date DATE,
    end_date DATE
);

-- Lifestyle Table
CREATE TABLE lifestyle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id),
    smoking_status VARCHAR(50),
    alcohol_use VARCHAR(50),
    drug_use TEXT,
    diet_preferences VARCHAR(255),
    exercise_frequency VARCHAR(50),
    exercise_type TEXT,
    stress_level VARCHAR(50),
    sleep_duration_hours NUMERIC,
    sleep_quality VARCHAR(50),
    mental_health_status VARCHAR(255),
    occupation TEXT,
    work_hours_per_week INTEGER,
    exposure_to_toxins BOOLEAN DEFAULT false,
    hobbies_and_interests TEXT,
    social_support_level VARCHAR(50),
    screen_time_hours NUMERIC,
    hydration_level VARCHAR(50),
    notes TEXT
);

-- Create indexes
CREATE INDEX idx_patients_first_name ON patients(first_name);
CREATE INDEX idx_patients_last_name ON patients(last_name);
CREATE INDEX idx_medical_history_patient ON medical_history(patient_id);
CREATE INDEX idx_medications_patient ON medications(patient_id);
CREATE INDEX idx_emergency_contacts_patient ON emergency_contacts(patient_id);

-- Create triggers
CREATE TRIGGER update_insurances_updated_at
    BEFORE UPDATE ON insurances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
