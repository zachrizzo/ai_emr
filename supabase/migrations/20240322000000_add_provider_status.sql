-- Add status column to providers table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'providers' AND column_name = 'status') THEN
        ALTER TABLE providers
        ADD COLUMN status VARCHAR(50) DEFAULT 'Active' NOT NULL;
    END IF;
END $$;

-- Update existing records to have 'Active' status
UPDATE providers
SET status = 'Active'
WHERE status IS NULL;
