-- Add updated_at column to emergency_contacts table
ALTER TABLE emergency_contacts ADD COLUMN updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now();

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_emergency_contacts_updated_at
    BEFORE UPDATE ON emergency_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
