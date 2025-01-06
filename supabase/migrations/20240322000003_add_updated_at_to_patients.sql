-- Add updated_at column to patients table
ALTER TABLE patients ADD COLUMN updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now();

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
