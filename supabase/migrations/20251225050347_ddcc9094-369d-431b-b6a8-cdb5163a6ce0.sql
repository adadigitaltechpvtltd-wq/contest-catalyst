-- Update default currency from INR to USD for contests table
ALTER TABLE public.contests 
ALTER COLUMN prize_currency SET DEFAULT 'USD';

-- Update default currency from INR to USD for wallet_transactions table
ALTER TABLE public.wallet_transactions 
ALTER COLUMN currency SET DEFAULT 'USD';