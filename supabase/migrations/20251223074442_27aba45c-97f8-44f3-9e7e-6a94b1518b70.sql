-- Drop the view and recreate it properly with SECURITY INVOKER
DROP VIEW IF EXISTS public.leaderboard_stats;

CREATE VIEW public.leaderboard_stats 
WITH (security_invoker = true) AS
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