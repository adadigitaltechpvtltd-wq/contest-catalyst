-- Add engagement columns to submissions table
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS download_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS like_count integer NOT NULL DEFAULT 0;

-- Create submission_likes table for tracking user likes
CREATE TABLE IF NOT EXISTS public.submission_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(submission_id, user_id)
);

-- Enable RLS on submission_likes
ALTER TABLE public.submission_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for submission_likes
CREATE POLICY "Anyone can view likes count"
ON public.submission_likes
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like"
ON public.submission_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
ON public.submission_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_view_count(submission_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.submissions
  SET view_count = view_count + 1
  WHERE id = submission_id_param;
END;
$$;

-- Function to increment download count
CREATE OR REPLACE FUNCTION public.increment_download_count(submission_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.submissions
  SET download_count = download_count + 1
  WHERE id = submission_id_param;
END;
$$;

-- Trigger to update like_count when likes are added/removed
CREATE OR REPLACE FUNCTION public.update_submission_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.submissions
    SET like_count = like_count + 1
    WHERE id = NEW.submission_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.submissions
    SET like_count = like_count - 1
    WHERE id = OLD.submission_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_submission_like_change
AFTER INSERT OR DELETE ON public.submission_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_submission_like_count();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_submission_likes_submission_id ON public.submission_likes(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_likes_user_id ON public.submission_likes(user_id);