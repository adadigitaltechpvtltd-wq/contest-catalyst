-- Add featured_in_hero column to contests table
ALTER TABLE public.contests 
ADD COLUMN featured_in_hero boolean NOT NULL DEFAULT false;

-- Add a comment for clarity
COMMENT ON COLUMN public.contests.featured_in_hero IS 'When true, this contest will be displayed in the hero section on the homepage';