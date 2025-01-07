-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a table for storing embeddings
CREATE TABLE record_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_type VARCHAR(50) NOT NULL, -- e.g., 'patient', 'appointment', 'medication'
    record_id UUID NOT NULL,
    content TEXT NOT NULL, -- The text content that was embedded
    embedding vector(1536), -- OpenAI's text-embedding-ada-002 uses 1536 dimensions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    organization_id UUID REFERENCES organizations(id)
);

-- Create indexes
CREATE INDEX ON record_embeddings USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
CREATE INDEX idx_record_embeddings_type_id ON record_embeddings(record_type, record_id);
CREATE INDEX idx_record_embeddings_org ON record_embeddings(organization_id);

-- Enable RLS
ALTER TABLE record_embeddings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view record embeddings from their organization"
    ON record_embeddings FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id
            FROM organization_members
            WHERE organization_id = record_embeddings.organization_id
        )
    );

-- Function to match records using vector similarity
CREATE OR REPLACE FUNCTION match_records(
    query_embedding vector(1536),
    match_threshold float,
    match_count int
)
RETURNS TABLE (
    id UUID,
    record_type VARCHAR,
    record_id UUID,
    content TEXT,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        record_embeddings.id,
        record_embeddings.record_type,
        record_embeddings.record_id,
        record_embeddings.content,
        1 - (record_embeddings.embedding <=> query_embedding) as similarity
    FROM record_embeddings
    WHERE 1 - (record_embeddings.embedding <=> query_embedding) > match_threshold
    ORDER BY record_embeddings.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to refresh embeddings when records are updated
CREATE OR REPLACE FUNCTION refresh_record_embedding()
RETURNS TRIGGER AS $$
BEGIN
    -- This is a placeholder. The actual embedding generation will be handled by the application
    -- This trigger just marks that a refresh is needed
    INSERT INTO embedding_refresh_queue (record_type, record_id, organization_id)
    VALUES (TG_ARGV[0], NEW.id, NEW.organization_id)
    ON CONFLICT (record_type, record_id) DO UPDATE
    SET processed = false, updated_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a queue table for embedding refresh
CREATE TABLE embedding_refresh_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_type VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    organization_id UUID REFERENCES organizations(id),
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(record_type, record_id)
);

-- Create triggers for various tables to queue embedding updates
CREATE TRIGGER refresh_patient_embedding
    AFTER INSERT OR UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION refresh_record_embedding('patient');

CREATE TRIGGER refresh_appointment_embedding
    AFTER INSERT OR UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION refresh_record_embedding('appointment');

CREATE TRIGGER refresh_medication_embedding
    AFTER INSERT OR UPDATE ON medications
    FOR EACH ROW
    EXECUTE FUNCTION refresh_record_embedding('medication');
