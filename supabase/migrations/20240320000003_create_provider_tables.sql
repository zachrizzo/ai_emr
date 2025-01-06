-- Providers Table
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255),
    phone_number VARCHAR(15),
    email VARCHAR(255),
    location_id UUID REFERENCES locations(id),
    notes TEXT,
    organization_id UUID REFERENCES organizations(id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Appointments Table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id),
    provider_id UUID REFERENCES providers(id),
    location_id UUID REFERENCES locations(id),
    appointment_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    reason_for_visit TEXT,
    diagnosis TEXT,
    follow_up_plan TEXT,
    notes TEXT,
    duration_minutes INTEGER DEFAULT 30,
    status VARCHAR(50) DEFAULT 'Scheduled',
    appointment_type VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    organization_id UUID REFERENCES organizations(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Vital Signs Table
CREATE TABLE vital_signs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id),
    height_cm NUMERIC,
    weight_kg NUMERIC,
    bmi NUMERIC,
    blood_pressure VARCHAR(50),
    heart_rate INTEGER,
    respiratory_rate INTEGER,
    temperature_celsius NUMERIC,
    oxygen_saturation NUMERIC
);

-- Symptoms Table
CREATE TABLE symptoms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id),
    symptom_description TEXT NOT NULL,
    severity_level VARCHAR(50),
    duration TEXT
);

-- Create indexes
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_provider ON appointments(provider_id);
CREATE INDEX idx_vital_signs_appointment ON vital_signs(appointment_id);
CREATE INDEX idx_symptoms_appointment ON symptoms(appointment_id);

-- Create triggers
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
