-- Enable the HTTP extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- Create a trigger function that will call our Edge Function
CREATE OR REPLACE FUNCTION public.handle_webhook_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the Edge Function
  -- Replace 'your-project-ref' with your actual Supabase project reference
  -- Replace 'your-function-name' with the actual Edge Function name you want to call
  PERFORM
    net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/your-function-name',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}',
      body := json_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'record', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END,
        'old_record', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD) END
      )::text
    );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example of how to create a trigger for a specific table
-- Replace 'your_table' with the actual table name you want to monitor
/*
CREATE TRIGGER webhook_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.your_table
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_webhook_event();
*/

-- To create a trigger, uncomment the above block and replace 'your_table'
-- with the actual table name you want to monitor
