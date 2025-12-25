-- Add soft delete columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Create index for faster queries on non-deleted users
CREATE INDEX IF NOT EXISTS idx_profiles_is_deleted ON public.profiles(is_deleted) WHERE is_deleted = false;

-- Create function to anonymize and soft delete a user account
CREATE OR REPLACE FUNCTION public.soft_delete_account(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pending_balance numeric;
  available_balance numeric;
  result jsonb;
BEGIN
  -- Check that the requesting user is deleting their own account
  IF auth.uid() IS NULL OR auth.uid() != _user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: You can only delete your own account');
  END IF;

  -- Check for pending balance
  SELECT COALESCE(SUM(amount), 0)
  INTO pending_balance
  FROM public.wallet_transactions
  WHERE user_id = _user_id
    AND type IN ('prize', 'bonus')
    AND status = 'pending';

  IF pending_balance > 0 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'You cannot delete your account while you have pending earnings. Please contact support.',
      'pending_balance', pending_balance
    );
  END IF;

  -- Check for available balance
  SELECT COALESCE(SUM(
    CASE 
      WHEN type IN ('prize', 'bonus') AND status = 'completed' THEN amount
      WHEN type = 'withdrawal' AND status = 'completed' THEN -amount
      ELSE 0
    END
  ), 0)
  INTO available_balance
  FROM public.wallet_transactions
  WHERE user_id = _user_id;

  IF available_balance > 0 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'You cannot delete your account while you have an available balance. Please withdraw your funds first or contact support.',
      'available_balance', available_balance
    );
  END IF;

  -- Anonymize the profile (soft delete)
  UPDATE public.profiles
  SET 
    is_deleted = true,
    deleted_at = now(),
    full_name = 'Deleted User',
    email = 'deleted_user_' || _user_id || '@gaal.app',
    avatar_url = NULL,
    bio = NULL,
    phone = NULL,
    instagram_url = NULL,
    twitter_url = NULL,
    upi_id = NULL,
    bank_account_number = NULL,
    bank_ifsc = NULL
  WHERE id = _user_id;

  -- Delete payment details
  DELETE FROM public.payment_details WHERE user_id = _user_id;

  -- Mark notifications as read and anonymize
  UPDATE public.notifications
  SET is_read = true
  WHERE user_id = _user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Account deleted successfully');
END;
$$;

-- Create function for admin to restore deleted accounts
CREATE OR REPLACE FUNCTION public.restore_deleted_account(_user_id uuid, _email text, _full_name text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check that the requesting user is an admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Only admins can restore accounts');
  END IF;

  -- Check if user is actually deleted
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND is_deleted = true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Account is not deleted or does not exist');
  END IF;

  -- Restore the profile
  UPDATE public.profiles
  SET 
    is_deleted = false,
    deleted_at = NULL,
    email = _email,
    full_name = COALESCE(_full_name, 'Restored User')
  WHERE id = _user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Account restored successfully');
END;
$$;

-- Update RLS policies to hide deleted users from public views
DROP POLICY IF EXISTS "Anyone can view public profile info" ON public.profiles;
CREATE POLICY "Anyone can view public profile info" 
ON public.profiles 
FOR SELECT
USING (is_deleted = false OR auth.uid() = id OR has_role(auth.uid(), 'admin'));

-- Admins can still see all profiles including deleted
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT
USING (has_role(auth.uid(), 'admin'));