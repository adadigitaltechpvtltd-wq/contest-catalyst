-- Update leaderboard_stats view to only count approved/winner submissions for consistency
DROP VIEW IF EXISTS public.leaderboard_stats;

CREATE VIEW public.leaderboard_stats AS
SELECT 
  p.id AS user_id,
  p.full_name,
  p.avatar_url,
  p.bio,
  COALESCE(
    (SELECT COUNT(DISTINCT s.contest_id) FROM public.submissions s WHERE s.user_id = p.id),
    0
  )::bigint AS contests_entered,
  COALESCE(
    (SELECT COUNT(*) FROM public.submissions s WHERE s.user_id = p.id AND s.status IN ('approved', 'winner')),
    0
  )::bigint AS total_submissions,
  COALESCE(
    (SELECT COUNT(*) FROM public.submissions s WHERE s.user_id = p.id AND s.status = 'winner'),
    0
  )::bigint AS wins,
  COALESCE(
    (SELECT ROUND(SUM(COALESCE(s.system_score, 0)))::bigint FROM public.submissions s WHERE s.user_id = p.id AND s.status IN ('approved', 'winner')),
    0
  )::bigint AS total_points
FROM public.profiles p
WHERE EXISTS (
  SELECT 1 FROM public.submissions sub WHERE sub.user_id = p.id
);

-- Grant access to the view
GRANT SELECT ON public.leaderboard_stats TO anon;
GRANT SELECT ON public.leaderboard_stats TO authenticated;