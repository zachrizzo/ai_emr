-- Create billing-related tables

-- Fee Schedules Table
CREATE TABLE fee_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    effective_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Fee Schedule Items Table
CREATE TABLE fee_schedule_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    fee_schedule_id UUID REFERENCES fee_schedules(id),
    cpt_code VARCHAR(10) NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Insurance Claims Table
CREATE TABLE insurance_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    patient_id UUID REFERENCES users(id),
    appointment_id UUID,  -- Add foreign key once appointments table exists
    claim_number VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    submitted_date DATE,
    processed_date DATE,
    insurance_provider VARCHAR(255),
    insurance_policy_number VARCHAR(255),
    denial_reason TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Invoices Table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    patient_id UUID REFERENCES users(id),
    appointment_id UUID,  -- Add foreign key once appointments table exists
    insurance_claim_id UUID REFERENCES insurance_claims(id),
    invoice_number VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    due_date DATE,
    total_amount DECIMAL(10,2) NOT NULL,
    balance_due DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    invoice_id UUID REFERENCES invoices(id),
    patient_id UUID REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'completed',
    payment_date TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Create triggers for updated_at
CREATE TRIGGER update_fee_schedules_updated_at
    BEFORE UPDATE ON fee_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fee_schedule_items_updated_at
    BEFORE UPDATE ON fee_schedule_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_claims_updated_at
    BEFORE UPDATE ON insurance_claims
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for organization_id and other common queries
CREATE INDEX idx_fee_schedules_org ON fee_schedules(organization_id);
CREATE INDEX idx_fee_schedule_items_org ON fee_schedule_items(organization_id);
CREATE INDEX idx_insurance_claims_org ON insurance_claims(organization_id);
CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_payments_org ON payments(organization_id);

-- Create indexes for other common queries
CREATE INDEX idx_insurance_claims_patient ON insurance_claims(patient_id);
CREATE INDEX idx_invoices_patient ON invoices(patient_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_fee_schedule_items_schedule ON fee_schedule_items(fee_schedule_id);

-- Create composite indexes for common filtered queries
CREATE INDEX idx_insurance_claims_org_status ON insurance_claims(organization_id, status);
CREATE INDEX idx_invoices_org_status ON invoices(organization_id, status);
CREATE INDEX idx_payments_org_status ON payments(organization_id, status);
CREATE INDEX idx_fee_schedules_org_status ON fee_schedules(organization_id, status);
