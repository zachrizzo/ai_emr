-- Drop the existing trigger
DROP TRIGGER IF EXISTS process_embedding_queue_trigger ON public.embedding_refresh_queue;

-- Modify the process_embedding_queue function to be optional
CREATE OR REPLACE FUNCTION public.process_embedding_queue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  edge_function_url text;
  service_role_key text;
  payload json;
  result json;
BEGIN
  -- Try to get the edge function URL and service role key from the database
  BEGIN
    SELECT current_setting('app.settings.edge_function_url', true) INTO edge_function_url;
    SELECT current_setting('app.settings.service_role_key', true) INTO service_role_key;
  EXCEPTION
    WHEN OTHERS THEN
      -- If settings are not available, silently skip processing
      RETURN NEW;
  END;

  -- If either setting is missing, skip processing
  IF edge_function_url IS NULL OR service_role_key IS NULL THEN
    RETURN NEW;
  END IF;

  -- Create the payload
  payload := json_build_object(
    'record_id', NEW.record_id,
    'record_type', NEW.record_type,
    'organization_id', NEW.organization_id
  );

  -- Try to make the HTTP request to the edge function
  BEGIN
    SELECT content::json INTO result
    FROM http((
      'POST',
      edge_function_url || '/process-embeddings',
      ARRAY[http_header('Authorization', 'Bearer ' || service_role_key)],
      'application/json',
      payload::text
    )::http_request);
  EXCEPTION
    WHEN OTHERS THEN
      -- If the HTTP request fails, log it but don't fail the transaction
      RAISE NOTICE 'Failed to process embedding: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER process_embedding_queue_trigger
  AFTER INSERT ON public.embedding_refresh_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.process_embedding_queue();
