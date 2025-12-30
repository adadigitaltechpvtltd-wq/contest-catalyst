-- Fix search path for the function
CREATE OR REPLACE FUNCTION public.on_submission_seo_approved()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  response_id bigint;
  supabase_url text;
  anon_key text;
BEGIN
  -- Only trigger if seo_approved changed from false to true
  IF NEW.seo_approved = TRUE AND (OLD.seo_approved IS NULL OR OLD.seo_approved = FALSE) THEN
    BEGIN
      -- Get Supabase configuration
      supabase_url := 'https://xoompskrczzucsohfcyy.supabase.co';
      anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvb21wc2tyY3p6dWNzb2hmY3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NjMxMjIsImV4cCI6MjA4MjAzOTEyMn0.CXP5OTLpct1SjcdDvMfYHnLgN0_B1CeQ0xCqtGYHnGk';
      
      -- Call Edge Function asynchronously using net.http_post
      SELECT request_id INTO response_id FROM net.http_post(
        url := supabase_url || '/functions/v1/generate-seo-page',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', anon_key,
          'Authorization', 'Bearer ' || anon_key
        ),
        body := jsonb_build_object('submission_id', NEW.id)
      );
      
      RAISE NOTICE 'SEO page generation triggered for submission %, request_id: %', NEW.id, response_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to call generate-seo-page edge function for submission %: %', NEW.id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$function$;