-- Enable RLS on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own record
CREATE POLICY "Users can view own record"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Allow admins to view all users
CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
USING (has_role(auth.uid(), 'admin'));