-- Add SEO fields to contests table
ALTER TABLE public.contests
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS keywords TEXT[];

-- Add SEO fields to submissions table
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- Create submission_tags table for SEO tagging
CREATE TABLE IF NOT EXISTS public.submission_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(submission_id, tag)
);

-- Enable RLS on submission_tags
ALTER TABLE public.submission_tags ENABLE ROW LEVEL SECURITY;

-- Anyone can view tags (for SEO)
CREATE POLICY "Anyone can view tags" ON public.submission_tags
  FOR SELECT USING (true);

-- Authenticated users can add tags to their own submissions
CREATE POLICY "Users can manage own submission tags" ON public.submission_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.id = submission_tags.submission_id
      AND s.user_id = auth.uid()
    )
  );

-- Admins can manage all tags
CREATE POLICY "Admins can manage all tags" ON public.submission_tags
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create unique constraint for contest slug + submission slug combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_contest_slug_unique 
  ON public.submissions(contest_id, slug) 
  WHERE slug IS NOT NULL;

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_contests_slug ON public.contests(slug);
CREATE INDEX IF NOT EXISTS idx_submissions_slug ON public.submissions(slug);

-- Function to generate URL-safe slug from title
CREATE OR REPLACE FUNCTION public.generate_slug(title TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  slug := lower(title);
  slug := regexp_replace(slug, '[^a-z0-9\s-]', '', 'g');
  slug := regexp_replace(slug, '\s+', '-', 'g');
  slug := regexp_replace(slug, '-+', '-', 'g');
  slug := trim(both '-' from slug);
  
  RETURN slug;
END;
$$;

-- Trigger to auto-generate contest slug on insert
CREATE OR REPLACE FUNCTION public.auto_generate_contest_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := generate_slug(NEW.title);
    final_slug := base_slug;
    
    -- Check for duplicates and add suffix if needed
    WHILE EXISTS (SELECT 1 FROM public.contests WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := final_slug;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_generate_contest_slug ON public.contests;
CREATE TRIGGER trigger_auto_generate_contest_slug
  BEFORE INSERT OR UPDATE ON public.contests
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_contest_slug();

-- Trigger to auto-generate submission slug on insert
CREATE OR REPLACE FUNCTION public.auto_generate_submission_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := generate_slug(NEW.title);
    final_slug := base_slug;
    
    -- Check for duplicates within the same contest and add suffix if needed
    WHILE EXISTS (
      SELECT 1 FROM public.submissions 
      WHERE slug = final_slug 
      AND contest_id = NEW.contest_id 
      AND id != NEW.id
    ) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := final_slug;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_generate_submission_slug ON public.submissions;
CREATE TRIGGER trigger_auto_generate_submission_slug
  BEFORE INSERT OR UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_submission_slug();

-- Generate slugs for existing contests
UPDATE public.contests 
SET slug = generate_slug(title) || '-' || substring(id::text, 1, 8)
WHERE slug IS NULL;

-- Generate slugs for existing submissions
UPDATE public.submissions 
SET slug = generate_slug(title) || '-' || substring(id::text, 1, 8)
WHERE slug IS NULL;