-- Add brand-related columns to contests table
ALTER TABLE public.contests
ADD COLUMN IF NOT EXISTS brand_name text,
ADD COLUMN IF NOT EXISTS brand_description text,
ADD COLUMN IF NOT EXISTS brand_website_url text,
ADD COLUMN IF NOT EXISTS brand_instagram_url text,
ADD COLUMN IF NOT EXISTS brand_twitter_url text,
ADD COLUMN IF NOT EXISTS brand_linkedin_url text,
ADD COLUMN IF NOT EXISTS brand_youtube_url text,
ADD COLUMN IF NOT EXISTS brand_cta_label text,
ADD COLUMN IF NOT EXISTS brand_cta_url text;

-- Add constraint for brand description max length
ALTER TABLE public.contests
ADD CONSTRAINT brand_description_max_length CHECK (char_length(brand_description) <= 500);