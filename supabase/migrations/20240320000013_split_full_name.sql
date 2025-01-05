-- Split full_name into first_name and last_name for patients
ALTER TABLE patients
ADD COLUMN first_name VARCHAR(255),
ADD COLUMN last_name VARCHAR(255);

-- Update existing records to split full_name
UPDATE patients
SET
    first_name = split_part(full_name, ' ', 1),
    last_name = CASE
        WHEN array_length(string_to_array(full_name, ' '), 1) > 1
        THEN array_to_string((string_to_array(full_name, ' '))[2:], ' ')
        ELSE NULL
    END;

-- Make first_name and last_name NOT NULL
ALTER TABLE patients
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;

-- Drop full_name column
ALTER TABLE patients DROP COLUMN full_name;

-- Update indexes
DROP INDEX IF EXISTS idx_patients_full_name;
CREATE INDEX idx_patients_first_name ON patients(first_name);
CREATE INDEX idx_patients_last_name ON patients(last_name);

-- Split full_name into first_name and last_name for providers
ALTER TABLE providers
ADD COLUMN first_name VARCHAR(255),
ADD COLUMN last_name VARCHAR(255);

-- Update existing records to split full_name
UPDATE providers
SET
    first_name = CASE
        WHEN full_name LIKE 'Dr.%' THEN split_part(substr(full_name, 5), ' ', 1)
        ELSE split_part(full_name, ' ', 1)
    END,
    last_name = CASE
        WHEN full_name LIKE 'Dr.%' THEN array_to_string((string_to_array(substr(full_name, 5), ' '))[2:], ' ')
        WHEN array_length(string_to_array(full_name, ' '), 1) > 1
        THEN array_to_string((string_to_array(full_name, ' '))[2:], ' ')
        ELSE NULL
    END;

-- Make first_name and last_name NOT NULL
ALTER TABLE providers
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;

-- Drop full_name column
ALTER TABLE providers DROP COLUMN full_name;
