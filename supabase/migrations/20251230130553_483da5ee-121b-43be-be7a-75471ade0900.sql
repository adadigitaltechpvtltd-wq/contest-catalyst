-- Enable HTTP extension for webhooks (required for trigger to call edge function)
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Add SEO approval columns to submissions table
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS seo_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS seo_page_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS seo_page_url TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_seo_approved 
ON public.submissions(seo_approved) WHERE seo_approved = TRUE;

CREATE INDEX IF NOT EXISTS idx_submissions_seo_page_generated 
ON public.submissions(seo_page_generated) WHERE seo_page_generated = TRUE;

-- Create trigger function to automatically call SEO generation Edge Function
-- IMPORTANT: The URL below must match your Supabase project URL
-- It currently uses: https://xoompskrczzucsohfcyy.supabase.co (same as other migrations)
-- If you're deploying to a different project, update this URL
CREATE OR REPLACE FUNCTION public.on_submission_seo_approved()
RETURNS TRIGGER AS $$
DECLARE
  response_id bigint;
BEGIN
  -- Only trigger if seo_approved changed from false to true
  IF NEW.seo_approved = TRUE AND (OLD.seo_approved IS NULL OR OLD.seo_approved = FALSE) THEN
    BEGIN
      -- Call Edge Function asynchronously using net.http_post from the http extension
      -- Note: Uses the same Supabase project URL pattern as other migrations
      -- The edge function is public and uses its own service role key from environment
      SELECT request_id INTO response_id FROM net.http_post(
        url := 'https://xoompskrczzucsohfcyy.supabase.co/functions/v1/generate-seo-page',
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS submission_seo_approved_trigger ON public.submissions;

-- Create trigger
CREATE TRIGGER submission_seo_approved_trigger
AFTER UPDATE ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.on_submission_seo_approved();

-- Add comment explaining the trigger
COMMENT ON TRIGGER submission_seo_approved_trigger ON public.submissions IS 
'Automatically calls generate-seo-page edge function when seo_approved is set to TRUE';

-- Add comment explaining the function
COMMENT ON FUNCTION public.on_submission_seo_approved() IS 
'Trigger function that invokes the generate-seo-page edge function when a submission is SEO approved';
