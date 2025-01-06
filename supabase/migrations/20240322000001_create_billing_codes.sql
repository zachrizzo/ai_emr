-- Create billing codes tables

-- CPT Code Categories
CREATE TABLE cpt_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- CPT Codes
CREATE TABLE cpt_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    category_id UUID REFERENCES cpt_categories(id),
    code VARCHAR(10) NOT NULL,
    description TEXT NOT NULL,
    long_description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    default_price DECIMAL(10,2),
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    UNIQUE(organization_id, code)
);

-- Create triggers for updated_at
CREATE TRIGGER update_cpt_categories_updated_at
    BEFORE UPDATE ON cpt_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cpt_codes_updated_at
    BEFORE UPDATE ON cpt_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_cpt_categories_org ON cpt_categories(organization_id);
CREATE INDEX idx_cpt_codes_org ON cpt_codes(organization_id);
CREATE INDEX idx_cpt_codes_category ON cpt_codes(category_id);
CREATE INDEX idx_cpt_codes_org_status ON cpt_codes(organization_id, status);
CREATE INDEX idx_cpt_codes_code ON cpt_codes(code);
