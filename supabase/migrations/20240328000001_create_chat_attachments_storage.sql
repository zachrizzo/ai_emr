DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'chat-attachments'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('chat-attachments', 'chat-attachments', true);
    END IF;
END $$;

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'chat-attachments'
    AND (LOWER(storage.extension(name)) = ANY (ARRAY['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'txt']))
);

-- Allow authenticated users to read files
CREATE POLICY "Allow authenticated users to read files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-attachments');

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete their own files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-attachments' AND owner = auth.uid());

-- Add attachments column to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS attachments TEXT[];
