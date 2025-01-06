-- Create appointment type enum
CREATE TYPE appointment_visit_type AS ENUM ('in_person', 'video', 'phone');

-- Create appointment status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM ('scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to appointments table
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurring_pattern TEXT,
ADD COLUMN IF NOT EXISTS visit_type appointment_visit_type DEFAULT 'in_person';

-- Create a temporary status column
ALTER TABLE appointments
ADD COLUMN temp_status appointment_status DEFAULT 'scheduled';

-- Update the temporary status column
UPDATE appointments
SET temp_status = CASE
    WHEN LOWER(status) = 'scheduled' THEN 'scheduled'::appointment_status
    WHEN LOWER(status) = 'checked_in' THEN 'checked_in'::appointment_status
    WHEN LOWER(status) = 'in_progress' THEN 'in_progress'::appointment_status
    WHEN LOWER(status) = 'completed' THEN 'completed'::appointment_status
    WHEN LOWER(status) = 'cancelled' THEN 'cancelled'::appointment_status
    WHEN LOWER(status) = 'no_show' THEN 'no_show'::appointment_status
    ELSE 'scheduled'::appointment_status
END;

-- Drop the old status column
ALTER TABLE appointments DROP COLUMN status;

-- Set constraints on temp_status
ALTER TABLE appointments ALTER COLUMN temp_status SET NOT NULL;
ALTER TABLE appointments ALTER COLUMN temp_status SET DEFAULT 'scheduled';

-- Rename temp_status to status
ALTER TABLE appointments RENAME COLUMN temp_status TO status;

-- Update appointment_type
ALTER TABLE appointments
ALTER COLUMN appointment_type DROP DEFAULT,
ALTER COLUMN appointment_type SET DATA TYPE TEXT;
