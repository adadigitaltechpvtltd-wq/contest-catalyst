-- Function to auto-populate SEO fields when submission is approved
CREATE OR REPLACE FUNCTION public.auto_populate_submission_seo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  contest_title TEXT;
  user_username TEXT;
BEGIN
  -- Only run when status changes to 'approved' or 'winner' and SEO fields are not already set
  IF (OLD.status IS DISTINCT FROM NEW.status) AND 
     NEW.status IN ('approved', 'winner') AND 
     (NEW.seo_title IS NULL OR NEW.seo_title = '') THEN
    
    -- Get contest title
    SELECT title INTO contest_title
    FROM public.contests
    WHERE id = NEW.contest_id;
    
    -- Get user's username or full_name
    SELECT COALESCE(username, full_name, 'Anonymous') INTO user_username
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Auto-populate SEO fields
    -- SEO Title = {photo.title} | {contest.title}
    NEW.seo_title := LEFT(NEW.title || ' | ' || COALESCE(contest_title, 'Photo Contest'), 60);
    
    -- Meta Description = {photo.title} – Submitted to {contest.title}. Original photography by {username}.
    NEW.meta_description := LEFT(
      NEW.title || ' – Submitted to ' || COALESCE(contest_title, 'Photo Contest') || 
      '. Original photography by ' || user_username || '.',
      160
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-populating SEO on approval
DROP TRIGGER IF EXISTS trigger_auto_populate_submission_seo ON public.submissions;
CREATE TRIGGER trigger_auto_populate_submission_seo
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_populate_submission_seo();

-- Add a column to flag titles that barely pass validation (for admin review)
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS title_quality_flag TEXT DEFAULT NULL;

COMMENT ON COLUMN public.submissions.title_quality_flag IS 'Flags for title quality: low, medium, or null if not flagged';