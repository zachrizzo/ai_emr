-- Enable the pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    patient_id UUID REFERENCES patients(id),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
    content TEXT NOT NULL,
    attachments TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create embedding_refresh_queue table
CREATE TABLE embedding_refresh_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_type TEXT NOT NULL,
    record_id UUID NOT NULL,
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create record_embeddings table
CREATE TABLE record_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_type TEXT NOT NULL,
    record_id UUID NOT NULL,
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (record_type, record_id)
);

-- Create indexes for better performance
CREATE INDEX ON record_embeddings USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
CREATE INDEX idx_record_embeddings_type_id ON record_embeddings(record_type, record_id);
CREATE INDEX idx_record_embeddings_org ON record_embeddings(organization_id);

-- -- Add RLS policies
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE embedding_refresh_queue ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE record_embeddings ENABLE ROW LEVEL SECURITY;

-- -- Conversations policies
-- CREATE POLICY "Users can view their organization's conversations"
--     ON conversations FOR SELECT
--     USING (organization_id IN (
--         SELECT id FROM organizations WHERE id = (auth.jwt()->>'organization_id')::UUID
--     ));

-- CREATE POLICY "Users can create conversations in their organization"
--     ON conversations FOR INSERT
--     WITH CHECK (organization_id IN (
--         SELECT id FROM organizations WHERE id = (auth.jwt()->>'organization_id')::UUID
--     ));

-- CREATE POLICY "Users can update their organization's conversations"
--     ON conversations FOR UPDATE
--     USING (organization_id IN (
--         SELECT id FROM organizations WHERE id = (auth.jwt()->>'organization_id')::UUID
--     ));

-- CREATE POLICY "Users can delete their organization's conversations"
--     ON conversations FOR DELETE
--     USING (organization_id IN (
--         SELECT id FROM organizations WHERE id = (auth.jwt()->>'organization_id')::UUID
--     ));

-- -- Messages policies
-- CREATE POLICY "Users can view messages in their conversations"
--     ON messages FOR SELECT
--     USING (
--         EXISTS (
--             SELECT 1 FROM conversations c
--             WHERE c.id = messages.conversation_id
--             AND c.organization_id IN (
--                 SELECT id FROM organizations WHERE id = (auth.jwt()->>'organization_id')::UUID
--             )
--         )
--     );

-- CREATE POLICY "Users can insert messages in their conversations"
--     ON messages FOR INSERT
--     WITH CHECK (
--         EXISTS (
--             SELECT 1 FROM conversations c
--             WHERE c.id = messages.conversation_id
--             AND c.organization_id IN (
--                 SELECT id FROM organizations WHERE id = (auth.jwt()->>'organization_id')::UUID
--             )
--         )
--     );

-- -- Embedding refresh queue policies
-- CREATE POLICY "Users can view their organization's embedding queue"
--     ON embedding_refresh_queue FOR SELECT
--     USING (organization_id IN (
--         SELECT id FROM organizations WHERE id = (auth.jwt()->>'organization_id')::UUID
--     ));

-- CREATE POLICY "Users can insert into their organization's embedding queue"
--     ON embedding_refresh_queue FOR INSERT
--     WITH CHECK (organization_id IN (
--         SELECT id FROM organizations WHERE id = (auth.jwt()->>'organization_id')::UUID
--     ));

-- -- Record embeddings policies
-- CREATE POLICY "Users can view their organization's embeddings"
--     ON record_embeddings FOR SELECT
--     USING (organization_id IN (
--         SELECT id FROM organizations WHERE id = (auth.jwt()->>'organization_id')::UUID
--     ));

-- CREATE POLICY "Users can insert into their organization's embeddings"
--     ON record_embeddings FOR INSERT
--     WITH CHECK (organization_id IN (
--         SELECT id FROM organizations WHERE id = (auth.jwt()->>'organization_id')::UUID
--     ));

-- Create function to update conversation updated_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update conversation timestamp
CREATE TRIGGER update_conversation_timestamp
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- Create function to queue records for embedding
CREATE OR REPLACE FUNCTION queue_record_for_embedding()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO embedding_refresh_queue (record_type, record_id, organization_id)
    VALUES (
        TG_ARGV[0], -- record type passed as trigger argument
        NEW.id,
        NEW.organization_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for each table
CREATE TRIGGER patients_embedding_trigger
    AFTER INSERT OR UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION queue_record_for_embedding('patient');

CREATE TRIGGER providers_embedding_trigger
    AFTER INSERT OR UPDATE ON providers
    FOR EACH ROW
    EXECUTE FUNCTION queue_record_for_embedding('provider');

CREATE TRIGGER appointments_embedding_trigger
    AFTER INSERT OR UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION queue_record_for_embedding('appointment');

CREATE TRIGGER medications_embedding_trigger
    AFTER INSERT OR UPDATE ON medications
    FOR EACH ROW
    EXECUTE FUNCTION queue_record_for_embedding('medication');

CREATE TRIGGER clinical_notes_embedding_trigger
    AFTER INSERT OR UPDATE ON clinical_notes
    FOR EACH ROW
    EXECUTE FUNCTION queue_record_for_embedding('note');

-- Create function for matching records with organization filter
CREATE OR REPLACE FUNCTION match_records(
    query_embedding vector(1536),
    match_threshold float,
    match_count int,
    organization_filter uuid
)
RETURNS TABLE (
    id uuid,
    record_type text,
    content text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.record_id,
        e.record_type,
        e.content,
        1 - (e.embedding <=> query_embedding) as similarity
    FROM
        record_embeddings e
    WHERE
        1 - (e.embedding <=> query_embedding) > match_threshold
        AND e.organization_id = organization_filter
    ORDER BY
        e.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Check if the current user has permission to set the parameter
DO $$
BEGIN
    -- Attempt to set the parameter only if the user has the necessary permissions
    PERFORM 1
    FROM pg_roles
    WHERE rolname = current_user
    AND rolsuper = true;

    IF FOUND THEN
        ALTER DATABASE postgres SET app.settings.edge_function_url = 'http://127.0.0.1:54321/functions/v1/process-embeddings';
    ELSE
        RAISE NOTICE 'Insufficient permissions to set app.settings.edge_function_url';
    END IF;
END $$;
