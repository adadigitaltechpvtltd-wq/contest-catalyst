-- Allow anyone to view basic public profile information (for user profile pages)
CREATE POLICY "Anyone can view public profile info" 
ON public.profiles 
FOR SELECT 
USING (true);