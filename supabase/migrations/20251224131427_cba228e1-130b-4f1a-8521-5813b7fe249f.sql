-- Drop the restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Users can view approved submissions" ON submissions;
DROP POLICY IF EXISTS "Admins can manage all submissions" ON submissions;

-- Create permissive SELECT policy for users to view their own or approved submissions
CREATE POLICY "Users can view own or approved submissions" 
ON submissions 
FOR SELECT 
USING (
  (status = ANY (ARRAY['approved'::submission_status, 'winner'::submission_status]))
  OR (user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
);

-- Create admin policy for INSERT, UPDATE, DELETE
CREATE POLICY "Admins can manage submissions" 
ON submissions 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));