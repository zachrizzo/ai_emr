-- Create storage bucket for fax documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('fax-documents', 'fax-documents', false);

-- Allow authenticated users to upload files
CREATE POLICY "Users can upload fax documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'fax-documents' AND
    auth.role() = 'authenticated'
);

-- Allow users to read their organization's fax documents
CREATE POLICY "Users can read their organization's fax documents"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'fax-documents' AND
    auth.role() = 'authenticated'
);

-- Allow users to delete their organization's fax documents
CREATE POLICY "Users can delete their organization's fax documents"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'fax-documents' AND
    auth.role() = 'authenticated'
);
