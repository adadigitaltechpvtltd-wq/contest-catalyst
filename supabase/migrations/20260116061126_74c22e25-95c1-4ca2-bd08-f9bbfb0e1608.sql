-- Add campaign_type enum
CREATE TYPE public.campaign_type AS ENUM ('photo', 'video');

-- Add campaign_type column to campaigns table, defaulting to 'photo' for existing campaigns
ALTER TABLE public.campaigns 
ADD COLUMN campaign_type public.campaign_type NOT NULL DEFAULT 'photo';

-- Add video-specific columns to submissions table
ALTER TABLE public.submissions 
ADD COLUMN video_url text,
ADD COLUMN video_duration_seconds integer,
ADD COLUMN video_thumbnail_url text;

-- Add comment for documentation
COMMENT ON COLUMN public.campaigns.campaign_type IS 'Type of campaign: photo for image submissions, video for reel/video submissions (max 30 seconds)';
COMMENT ON COLUMN public.submissions.video_url IS 'URL to video file for video campaign submissions';
COMMENT ON COLUMN public.submissions.video_duration_seconds IS 'Duration of submitted video in seconds (max 30)';
COMMENT ON COLUMN public.submissions.video_thumbnail_url IS 'Thumbnail image URL for video submissions';