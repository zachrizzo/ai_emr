-- Enable HTTP extension
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Create function to process embedding queue
CREATE OR REPLACE FUNCTION public.process_embedding_queue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload json;
  result json;
BEGIN
  -- Create the payload
  payload := json_build_object(
    'record_type', NEW.record_type,
    'record_id', NEW.record_id,
    'organization_id', NEW.organization_id,
    'trigger_id', NEW.id
  );

  -- Make the HTTP request to the edge function
  SELECT content::json INTO result
  FROM http((
    'POST',
    'http://127.0.0.1:54321/functions/v1/process-embeddings',
    ARRAY[
      http_header('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    payload::text
  )::http_request);

  -- Log the result for debugging
  RAISE NOTICE 'Edge function response: %', result;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors but don't fail the transaction
    RAISE WARNING 'Error in process_embedding_queue: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on embedding_refresh_queue
DROP TRIGGER IF EXISTS process_embedding_queue_trigger ON public.embedding_refresh_queue;
CREATE TRIGGER process_embedding_queue_trigger
  AFTER INSERT ON public.embedding_refresh_queue
  FOR EACH ROW
  WHEN (NEW.processed = false)
  EXECUTE FUNCTION public.process_embedding_queue();
