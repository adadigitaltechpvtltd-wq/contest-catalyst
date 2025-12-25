-- Add new scoring columns to submissions table
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS duplicate_similarity_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS image_quality_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS system_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS combined_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS analysis_completed_at timestamp with time zone DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.submissions.duplicate_similarity_score IS 'Similarity percentage with other submissions (0-1)';
COMMENT ON COLUMN public.submissions.image_quality_score IS 'Image quality score from 0-100 (sharpness, resolution, exposure)';
COMMENT ON COLUMN public.submissions.system_score IS 'Calculated system score based on AI analysis (0-100)';
COMMENT ON COLUMN public.submissions.combined_score IS 'Final score combining system_score and admin_score (0-100)';
COMMENT ON COLUMN public.submissions.analysis_completed_at IS 'Timestamp when background analysis was completed';