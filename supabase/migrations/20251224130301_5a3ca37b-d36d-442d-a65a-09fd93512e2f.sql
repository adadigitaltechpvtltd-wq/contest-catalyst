-- Create saved_contests table for persisting user's saved contests
CREATE TABLE public.saved_contests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, contest_id)
);

-- Enable Row Level Security
ALTER TABLE public.saved_contests ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved contests
CREATE POLICY "Users can view own saved contests"
ON public.saved_contests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can save contests
CREATE POLICY "Users can save contests"
ON public.saved_contests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can unsave contests
CREATE POLICY "Users can unsave contests"
ON public.saved_contests
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_saved_contests_user_id ON public.saved_contests(user_id);
CREATE INDEX idx_saved_contests_contest_id ON public.saved_contests(contest_id);