-- Update existing contests to use USD currency
UPDATE public.contests 
SET prize_currency = 'USD' 
WHERE prize_currency = 'INR';

-- Update existing wallet transactions to use USD currency
UPDATE public.wallet_transactions 
SET currency = 'USD' 
WHERE currency = 'INR';