-- Drop and recreate the trigger function to include proper authorization headers
CREATE OR REPLACE FUNCTION public.on_submission_seo_approved()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  response_id bigint;
  supabase_url text;
  anon_key text;
BEGIN
  -- Only trigger if seo_approved changed from false to true
  IF NEW.seo_approved = TRUE AND (OLD.seo_approved IS NULL OR OLD.seo_approved = FALSE) THEN
    BEGIN
      -- Get Supabase configuration from vault or use hardcoded values
      supabase_url := 'https://xoompskrczzucsohfcyy.supabase.co';
      anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvb21wc2tyY3p6dWNzb2hmY3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NjMxMjIsImV4cCI6MjA4MjAzOTEyMn0.CXP5OTLpct1SjcdDvMfYHnLgN0_B1CeQ0xCqtGYHnGk';
      
      -- Call Edge Function asynchronously using net.http_post from the http extension
      SELECT request_id INTO response_id FROM net.http_post(
        url := supabase_url || '/functions/v1/generate-seo-page',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', anon_key,
          'Authorization', 'Bearer ' || anon_key
        ),
        body := jsonb_build_object('submission_id', NEW.id)
      );
      
      -- Log successful call (response_id will be populated if call succeeded)
      RAISE NOTICE 'SEO page generation triggered for submission %, request_id: %', NEW.id, response_id;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the transaction
      -- This ensures submission approval completes even if edge function call fails
      RAISE WARNING 'Failed to call generate-seo-page edge function for submission %: %', NEW.id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$function$;