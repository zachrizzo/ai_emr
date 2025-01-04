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

-- Create trigger
CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
