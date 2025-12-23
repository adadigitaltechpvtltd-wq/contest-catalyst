-- Fix get_wallet_balance function to require authorization
-- Users can only view their own balance, admins can view any user's balance

CREATE OR REPLACE FUNCTION public.get_wallet_balance(_user_id uuid)
 RETURNS numeric
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT CASE 
    WHEN _user_id = auth.uid() OR has_role(auth.uid(), 'admin') THEN
      COALESCE(SUM(
        CASE 
          WHEN type = 'prize' AND status = 'completed' THEN amount
          WHEN type = 'withdrawal' AND status = 'completed' THEN -amount
          WHEN type = 'bonus' AND status = 'completed' THEN amount
          ELSE 0
        END
      ), 0)
    ELSE NULL
  END
  FROM public.wallet_transactions
  WHERE user_id = _user_id
$$;