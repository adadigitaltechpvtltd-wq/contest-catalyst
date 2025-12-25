-- Remove AI-related columns from submissions table
ALTER TABLE public.submissions 
DROP COLUMN IF EXISTS ai_probability_score,
DROP COLUMN IF EXISTS ai_detection_provider,
DROP COLUMN IF EXISTS ai_detection_raw_response;