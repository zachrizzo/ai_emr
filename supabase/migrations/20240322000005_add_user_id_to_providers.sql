-- Add user_id column to providers table
ALTER TABLE providers
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Create index for user_id
CREATE INDEX idx_providers_user_id ON providers(user_id);

-- Update clinical_notes to reference user_id instead of provider_id
ALTER TABLE clinical_notes
DROP CONSTRAINT clinical_notes_provider_id_fkey,
ADD CONSTRAINT clinical_notes_provider_id_fkey
    FOREIGN KEY (provider_id)
    REFERENCES auth.users(id);
