-- Enable RLS on the leaderboard_stats view and allow public read access
ALTER VIEW public.leaderboard_stats SET (security_invoker = on);

-- Since views with security_invoker inherit RLS from underlying tables,
-- and we want the leaderboard to be publicly accessible,
-- we need to recreate it as a security definer view or create a policy.
-- Let's drop and recreate the view with security_barrier = false for public access

DROP VIEW IF EXISTS public.leaderboard_stats;

CREATE OR REPLACE VIEW public.leaderboard_stats
WITH (security_barrier = false)
AS
SELECT 
  p.id AS user_id,
  p.full_name,
  p.avatar_url,
  p.bio,
  count(DISTINCT s.id) FILTER (WHERE s.status = 'winner'::submission_status) AS wins,
  count(DISTINCT s.id) FILTER (WHERE s.status = ANY (ARRAY['approved'::submission_status, 'winner'::submission_status])) AS total_submissions,
  count(DISTINCT s.contest_id) AS contests_entered
FROM profiles p
LEFT JOIN submissions s ON s.user_id = p.id
WHERE p.is_banned = false OR p.is_banned IS NULL
GROUP BY p.id, p.full_name, p.avatar_url, p.bio
ORDER BY wins DESC, total_submissions DESC;

-- Grant SELECT access to the public (anon users)
GRANT SELECT ON public.leaderboard_stats TO anon;
GRANT SELECT ON public.leaderboard_stats TO authenticated;