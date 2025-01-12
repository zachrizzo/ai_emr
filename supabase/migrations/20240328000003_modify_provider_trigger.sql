-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS on_provider_change ON providers;

-- Create a function that safely checks if edge function URL is set
CREATE OR REPLACE FUNCTION check_edge_function_url()
RETURNS boolean AS $$
BEGIN
    -- Try to get the edge function URL setting
    BEGIN
        PERFORM current_setting('app.settings.edge_function_url', true);
        RETURN true;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN false;
    END;
END;
$$ LANGUAGE plpgsql;

-- Modify the trigger function to be completely optional
CREATE OR REPLACE FUNCTION handle_provider_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only queue for embedding if edge function URL is set
    BEGIN
        IF check_edge_function_url() THEN
            INSERT INTO embedding_refresh_queue (record_type, record_id, organization_id)
            VALUES ('provider', NEW.id, NEW.organization_id);
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            -- Silently ignore any errors
            NULL;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER on_provider_change
    AFTER INSERT OR UPDATE ON providers
    FOR EACH ROW
    EXECUTE FUNCTION handle_provider_change();
