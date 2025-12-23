-- CRITICAL: Fix overly permissive profile policy that exposes all user PII
-- This policy currently allows any authenticated user to see ALL profile data including emails, phones, etc.
DROP POLICY IF EXISTS "Anyone can view leaderboard stats" ON public.profiles;

-- Add server-side validation constraints for reports table
-- This enforces input length limits at the database level
ALTER TABLE public.reports 
  ADD CONSTRAINT check_reason_length 
    CHECK (char_length(reason) <= 500);

ALTER TABLE public.reports 
  ADD CONSTRAINT check_description_length 
    CHECK (char_length(description) <= 3000);

-- Fix get_wallet_balance function to raise exception on unauthorized access
-- instead of silently returning NULL (which could leak information)
CREATE OR REPLACE FUNCTION public.get_wallet_balance(_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  balance numeric;
BEGIN
  -- Check authorization first
  IF _user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Cannot view wallet balance for other users';
  END IF;
  
  -- Calculate balance for authorized users
  SELECT COALESCE(SUM(
    CASE 
      WHEN type = 'prize' AND status = 'completed' THEN amount
      WHEN type = 'withdrawal' AND status = 'completed' THEN -amount
      WHEN type = 'bonus' AND status = 'completed' THEN amount
      ELSE 0
    END
  ), 0)
  INTO balance
  FROM public.wallet_transactions
  WHERE user_id = _user_id;
  
  RETURN balance;
END;
$$;