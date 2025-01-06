-- Add updated_at column to providers table
ALTER TABLE providers ADD COLUMN updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now();

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_providers_updated_at
    BEFORE UPDATE ON providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
