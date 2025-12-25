-- Add perceptual hash column for duplicate detection
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS perceptual_hash text DEFAULT NULL;

-- Add index for faster hash lookups
CREATE INDEX IF NOT EXISTS idx_submissions_perceptual_hash 
ON public.submissions (perceptual_hash) 
WHERE perceptual_hash IS NOT NULL;

-- Add analysis_method column to track which method was used
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS analysis_method text DEFAULT 'cpu-local';

-- Add detailed anomaly breakdown columns
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS blur_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS exposure_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS noise_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS sharpness_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS contrast_score numeric DEFAULT 0;