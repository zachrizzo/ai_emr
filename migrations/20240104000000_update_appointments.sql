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
ADD COLUMN IF NOT EXISTS visit_type appointment_visit_type DEFAULT 'in_person',
ALTER COLUMN status TYPE appointment_status USING status::appointment_status,
ALTER COLUMN appointment_type DROP DEFAULT,
ALTER COLUMN appointment_type SET DATA TYPE TEXT;
