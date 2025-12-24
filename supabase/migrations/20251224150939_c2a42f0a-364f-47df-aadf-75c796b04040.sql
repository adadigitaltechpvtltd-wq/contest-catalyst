-- Fix admin submissions list: enable PostgREST relationship for embedding profiles
-- Adds a public FK so queries like profile:profiles(...) work in AdminSubmissions/AdminDashboard

ALTER TABLE public.submissions
ADD CONSTRAINT submissions_user_id_profiles_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;