-- Add blood glucose column to vitals table
ALTER TABLE vitals ADD COLUMN IF NOT EXISTS blood_glucose INTEGER;

-- Add constraint for valid blood glucose range
ALTER TABLE vitals ADD CONSTRAINT valid_blood_glucose CHECK (blood_glucose IS NULL OR (blood_glucose >= 20 AND blood_glucose <= 600));
