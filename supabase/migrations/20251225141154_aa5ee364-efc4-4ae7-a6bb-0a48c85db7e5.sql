-- Add foreign key from wallet_transactions to profiles for proper join support
-- First check if the constraint already exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'wallet_transactions_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;