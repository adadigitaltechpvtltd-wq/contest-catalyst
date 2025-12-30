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
BEGIN
  -- Only trigger if seo_approved changed from false to true
  IF NEW.seo_approved = TRUE AND (OLD.seo_approved IS NULL OR OLD.seo_approved = FALSE) THEN
    -- Call Edge Function asynchronously using net.http_post from the http extension
    -- Note: Uses the same Supabase project URL pattern as other migrations
    PERFORM net.http_post(
      url := 'https://xoompskrczzucsohfcyy.supabase.co/functions/v1/generate-seo-page',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('submission_id', NEW.id)
    );
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
