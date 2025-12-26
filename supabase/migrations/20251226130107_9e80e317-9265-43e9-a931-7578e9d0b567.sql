-- Add storage policy for admins to upload contest cover images
CREATE POLICY "Admins can upload contest covers"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'submissions' 
  AND (storage.foldername(name))[1] = 'contests'
  AND public.has_role(auth.uid(), 'admin')
);

-- Add policy for admins to update contest covers
CREATE POLICY "Admins can update contest covers"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'submissions' 
  AND (storage.foldername(name))[1] = 'contests'
  AND public.has_role(auth.uid(), 'admin')
);

-- Add policy for admins to delete contest covers
CREATE POLICY "Admins can delete contest covers"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'submissions' 
  AND (storage.foldername(name))[1] = 'contests'
  AND public.has_role(auth.uid(), 'admin')
);