-- ============================================
-- SECURITY FIX 1: Add authorization check to process_scheduled_deletions()
-- ============================================
CREATE OR REPLACE FUNCTION public.process_scheduled_deletions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer := 0;
  user_record record;
BEGIN
  -- SECURITY FIX: Only allow admins or service role (null auth.uid) to execute
  IF auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only system or admins can process deletions';
  END IF;

  -- Find all accounts past their scheduled deletion date
  FOR user_record IN 
    SELECT id FROM public.profiles 
    WHERE scheduled_deletion_at IS NOT NULL 
    AND scheduled_deletion_at <= now()
    AND is_deleted = false
  LOOP
    -- Anonymize the profile
    UPDATE public.profiles
    SET 
      is_deleted = true,
      deleted_at = now(),
      scheduled_deletion_at = NULL,
      full_name = 'Deleted User',
      email = 'deleted_user_' || user_record.id || '@gaal.app',
      avatar_url = NULL,
      bio = NULL,
      phone = NULL,
      instagram_url = NULL,
      twitter_url = NULL,
      upi_id = NULL,
      bank_account_number = NULL,
      bank_ifsc = NULL
    WHERE id = user_record.id;

    -- Delete payment details
    DELETE FROM public.payment_details WHERE user_id = user_record.id;

    -- Mark notifications as read
    UPDATE public.notifications
    SET is_read = true
    WHERE user_id = user_record.id;

    deleted_count := deleted_count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'deleted_count', deleted_count);
END;
$$;

-- ============================================
-- SECURITY FIX 2: Restrict profiles table - remove public PII exposure
-- ============================================

-- Drop the overly permissive policy that exposes sensitive data
DROP POLICY IF EXISTS "Anyone can view public profile info" ON public.profiles;

-- Create a public view with only safe, non-sensitive fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  username,
  full_name,
  avatar_url,
  bio,
  instagram_url,
  twitter_url,
  created_at
FROM public.profiles
WHERE is_deleted = false AND is_banned = false;

-- Grant public access to the safe view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- ============================================
-- SECURITY FIX 3: Add CHECK constraints for input validation
-- ============================================

-- Profiles table constraints
ALTER TABLE public.profiles
  ADD CONSTRAINT check_full_name_length CHECK (full_name IS NULL OR char_length(full_name) <= 100),
  ADD CONSTRAINT check_bio_length CHECK (bio IS NULL OR char_length(bio) <= 1000),
  ADD CONSTRAINT check_phone_length CHECK (phone IS NULL OR char_length(phone) <= 20),
  ADD CONSTRAINT check_upi_length CHECK (upi_id IS NULL OR char_length(upi_id) <= 100),
  ADD CONSTRAINT check_bank_account_length CHECK (bank_account_number IS NULL OR char_length(bank_account_number) <= 30),
  ADD CONSTRAINT check_ifsc_length CHECK (bank_ifsc IS NULL OR char_length(bank_ifsc) <= 20);

-- Contests table constraints
ALTER TABLE public.contests
  ADD CONSTRAINT check_title_length CHECK (char_length(title) <= 200),
  ADD CONSTRAINT check_description_length CHECK (description IS NULL OR char_length(description) <= 5000),
  ADD CONSTRAINT check_theme_length CHECK (theme IS NULL OR char_length(theme) <= 200),
  ADD CONSTRAINT check_brand_name_length CHECK (brand_name IS NULL OR char_length(brand_name) <= 200);

-- Submissions table constraints  
ALTER TABLE public.submissions
  ADD CONSTRAINT check_submission_title_length CHECK (char_length(title) <= 200),
  ADD CONSTRAINT check_submission_description_length CHECK (description IS NULL OR char_length(description) <= 1000);