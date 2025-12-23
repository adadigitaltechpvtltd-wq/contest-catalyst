-- Add is_banned column to profiles for user management
ALTER TABLE public.profiles ADD COLUMN is_banned boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN banned_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN banned_reason text;

-- Create a view for leaderboard stats (aggregating wins and submissions)
CREATE OR REPLACE VIEW public.leaderboard_stats AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.avatar_url,
  p.bio,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'winner') as wins,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status IN ('approved', 'winner')) as total_submissions,
  COUNT(DISTINCT s.contest_id) as contests_entered
FROM public.profiles p
LEFT JOIN public.submissions s ON s.user_id = p.id
WHERE p.is_banned = false OR p.is_banned IS NULL
GROUP BY p.id, p.full_name, p.avatar_url, p.bio
ORDER BY wins DESC, total_submissions DESC;

-- Allow public read access to leaderboard stats
CREATE POLICY "Anyone can view leaderboard stats"
ON public.profiles
FOR SELECT
USING (true);