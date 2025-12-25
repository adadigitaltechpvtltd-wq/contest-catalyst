-- Update leaderboard_stats view to only include users with activity
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
WHERE (p.is_banned = false OR p.is_banned IS NULL)
GROUP BY p.id, p.full_name, p.avatar_url, p.bio
HAVING count(DISTINCT s.id) > 0 OR count(DISTINCT s.contest_id) > 0
ORDER BY wins DESC, total_submissions DESC;

-- Grant SELECT access to the public (anon users)
GRANT SELECT ON public.leaderboard_stats TO anon;
GRANT SELECT ON public.leaderboard_stats TO authenticated;