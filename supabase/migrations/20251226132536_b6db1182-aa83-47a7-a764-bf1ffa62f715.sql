-- Add category column to contests table
ALTER TABLE public.contests
ADD COLUMN IF NOT EXISTS category text;

-- Add index for category for faster lookups
CREATE INDEX IF NOT EXISTS idx_contests_category ON public.contests(category);

-- Add comment for documentation
COMMENT ON COLUMN public.contests.category IS 'Contest category in slug format (e.g., street-photography, wildlife, portraits)';