-- Database Schema for AI EMR System
-- This file contains all table definitions and their relationships

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations Table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies for organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations are viewable by authenticated users" ON organizations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Organizations are insertable by authenticated users" ON organizations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Organization Members Table
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(255) NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, organization_id)
);

-- Add RLS policies for organization_members
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members are viewable by organization users" ON organization_members
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Organization members are insertable by authenticated users during signup" ON organization_members
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create function to handle user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (new.id, new.email);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Users Table
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Create function to get user's organization
CREATE OR REPLACE FUNCTION get_user_organization(user_uuid UUID)
RETURNS SETOF organizations AS $$
BEGIN
    RETURN QUERY
    SELECT o.*
    FROM organizations o
    INNER JOIN organization_members om ON o.id = om.organization_id
    WHERE om.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Roles Table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_role_id UUID REFERENCES roles(id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    organization_id UUID REFERENCES organizations(id)
);

-- User Roles Junction Table
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id),
    role_id UUID REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
);

-- Permissions Table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Role Permissions Junction Table
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id),
    permission_id UUID REFERENCES permissions(id),
    PRIMARY KEY (role_id, permission_id)
);

-- Locations Table
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone_number VARCHAR(15),
    email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    latitude NUMERIC,
    longitude NUMERIC,
    status VARCHAR(50) DEFAULT 'Active',
    manager_name VARCHAR(255),
    operating_hours TEXT,
    timezone VARCHAR(50),
    capacity INTEGER,
    is_primary BOOLEAN DEFAULT false,
    organization_id UUID REFERENCES organizations(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Patients Table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
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

-- Providers Table
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255),
    phone_number VARCHAR(15),
    email VARCHAR(255),
    location_id UUID REFERENCES locations(id),
    notes TEXT,
    organization_id UUID REFERENCES organizations(id),
    deleted_at TIMESTAMP WITH TIME ZONE
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

-- Teams Table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    leader_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    organization_id UUID REFERENCES organizations(id)
);

-- Team Members Junction Table
CREATE TABLE team_members (
    team_id UUID REFERENCES teams(id),
    user_id UUID REFERENCES users(id),
    PRIMARY KEY (team_id, user_id)
);

-- System Settings Table
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_name VARCHAR(255) NOT NULL,
    setting_value JSONB,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    table_name VARCHAR(255) NOT NULL,
    record_id UUID,
    action VARCHAR(50) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Activity Logs Table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50),
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITHOUT TIME ZONE
);

-- Languages Table
CREATE TABLE languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL,
    name VARCHAR(50) NOT NULL
);

-- Translations Table
CREATE TABLE translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id UUID REFERENCES languages(id),
    key VARCHAR(255) NOT NULL,
    value TEXT NOT NULL
);

-- API Keys Table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    key VARCHAR(255) NOT NULL,
    description TEXT,
    permissions JSONB,
    expires_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- User Sessions Table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_token VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITHOUT TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Two Factor Authentication Table
CREATE TABLE two_factor_auth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    secret VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT false,
    backup_codes JSONB,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Password Reset Tokens Table
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Role Audit Logs Table
CREATE TABLE role_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES users(id),
    role_id UUID REFERENCES roles(id),
    action VARCHAR(50) NOT NULL,
    changes JSONB,
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Data Transfer Logs Table
CREATE TABLE data_transfer_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    operation VARCHAR(50) NOT NULL,
    data_type VARCHAR(255) NOT NULL,
    details JSONB,
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Backups Table
CREATE TABLE backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type VARCHAR(50) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    size BIGINT,
    status VARCHAR(50) DEFAULT 'completed'
);

-- Tasks Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(50),
    due_date TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    organization_id UUID REFERENCES organizations(id)
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

-- Role Hierarchy Table
CREATE TABLE role_hierarchy (
    parent_role_id UUID REFERENCES roles(id),
    child_role_id UUID REFERENCES roles(id),
    PRIMARY KEY (parent_role_id, child_role_id)
);

-- Add indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_patients_full_name ON patients(full_name);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_medical_history_patient ON medical_history(patient_id);
CREATE INDEX idx_medications_patient ON medications(patient_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);
CREATE INDEX idx_form_submissions_patient ON form_submissions(patient_id);
CREATE INDEX idx_emergency_contacts_patient ON emergency_contacts(patient_id);
