-- Allow users to delete their own pending submissions
CREATE POLICY "Users can delete own pending submissions" 
ON submissions 
FOR DELETE 
USING ((user_id = auth.uid()) AND (status = 'pending'::submission_status));