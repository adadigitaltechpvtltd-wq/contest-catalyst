-- Create function to get pending balance (prizes waiting to be paid)
CREATE OR REPLACE FUNCTION public.get_pending_balance(_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  pending_amount numeric;
BEGIN
  -- Check authorization first
  IF _user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Cannot view wallet balance for other users';
  END IF;
  
  -- Calculate pending balance (prizes and bonuses that are pending)
  SELECT COALESCE(SUM(amount), 0)
  INTO pending_amount
  FROM public.wallet_transactions
  WHERE user_id = _user_id
    AND type IN ('prize', 'bonus')
    AND status = 'pending';
  
  RETURN pending_amount;
END;
$$;

-- Create function to get total earned (all completed + pending prizes, never decreases)
CREATE OR REPLACE FUNCTION public.get_total_earned(_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_amount numeric;
BEGIN
  -- Check authorization first
  IF _user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Cannot view wallet balance for other users';
  END IF;
  
  -- Calculate total earned (all prizes/bonuses that are pending or completed)
  SELECT COALESCE(SUM(amount), 0)
  INTO total_amount
  FROM public.wallet_transactions
  WHERE user_id = _user_id
    AND type IN ('prize', 'bonus')
    AND status IN ('pending', 'completed');
  
  RETURN total_amount;
END;
$$;

-- Update get_wallet_balance to be the "Available Balance" 
-- Available = completed prizes/bonuses - completed withdrawals
CREATE OR REPLACE FUNCTION public.get_wallet_balance(_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  balance numeric;
BEGIN
  -- Check authorization first
  IF _user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Cannot view wallet balance for other users';
  END IF;
  
  -- Calculate available balance (completed prizes/bonuses minus completed withdrawals)
  SELECT COALESCE(SUM(
    CASE 
      WHEN type IN ('prize', 'bonus') AND status = 'completed' THEN amount
      WHEN type = 'withdrawal' AND status = 'completed' THEN -amount
      ELSE 0
    END
  ), 0)
  INTO balance
  FROM public.wallet_transactions
  WHERE user_id = _user_id;
  
  RETURN balance;
END;
$$;