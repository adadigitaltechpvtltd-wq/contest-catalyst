-- Add scheduled deletion date column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS scheduled_deletion_at timestamp with time zone;

-- Create index for scheduled deletions
CREATE INDEX IF NOT EXISTS idx_profiles_scheduled_deletion 
ON public.profiles(scheduled_deletion_at) 
WHERE scheduled_deletion_at IS NOT NULL AND is_deleted = false;

-- Update soft_delete_account to schedule deletion instead of immediate anonymization
CREATE OR REPLACE FUNCTION public.soft_delete_account(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pending_balance numeric;
  available_balance numeric;
  deletion_date timestamp with time zone;
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

  -- Schedule deletion for 30 days from now
  deletion_date := now() + interval '30 days';

  -- Mark account for scheduled deletion (don't anonymize yet)
  UPDATE public.profiles
  SET 
    scheduled_deletion_at = deletion_date
  WHERE id = _user_id;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Account scheduled for deletion',
    'deletion_date', deletion_date
  );
END;
$$;

-- Create function to cancel scheduled deletion
CREATE OR REPLACE FUNCTION public.cancel_account_deletion(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check that the requesting user is canceling their own deletion
  IF auth.uid() IS NULL OR auth.uid() != _user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Check if deletion is scheduled
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id 
    AND scheduled_deletion_at IS NOT NULL 
    AND is_deleted = false
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'No scheduled deletion found');
  END IF;

  -- Cancel the scheduled deletion
  UPDATE public.profiles
  SET scheduled_deletion_at = NULL
  WHERE id = _user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Account deletion cancelled');
END;
$$;

-- Create function to permanently delete accounts past grace period (called by cron)
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