-- Drop and recreate view to add username column

DROP VIEW IF EXISTS public.leaderboard_stats;

CREATE VIEW public.leaderboard_stats AS
SELECT p.id AS user_id,
       p.full_name,
       p.avatar_url,
       p.bio,
       p.username,
       COALESCE((
         SELECT count(DISTINCT s.contest_id)
         FROM public.submissions s
         WHERE s.user_id = p.id
       ), 0::bigint) AS contests_entered,
       COALESCE((
         SELECT count(*)
         FROM public.submissions s
         WHERE s.user_id = p.id
           AND s.status = ANY (ARRAY['approved'::submission_status, 'winner'::submission_status])
       ), 0::bigint) AS total_submissions,
       COALESCE((
         SELECT count(*)
         FROM public.submissions s
         WHERE s.user_id = p.id
           AND s.status = 'winner'::submission_status
       ), 0::bigint) AS wins,
       COALESCE((
         SELECT round(sum(COALESCE(s.system_score, 0::numeric)))::bigint
         FROM public.submissions s
         WHERE s.user_id = p.id
           AND s.status = ANY (ARRAY['approved'::submission_status, 'winner'::submission_status])
       ), 0::bigint) AS total_points
FROM public.profiles p
WHERE EXISTS (
  SELECT 1
  FROM public.submissions sub
  WHERE sub.user_id = p.id
);

-- Ensure trigger exists to auto-generate usernames
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'profiles_generate_username'
  ) THEN
    CREATE TRIGGER profiles_generate_username
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_username();
  END IF;
END $$;

-- Backfill usernames for existing profiles
UPDATE public.profiles
SET full_name = full_name
WHERE username IS NULL OR username = '';