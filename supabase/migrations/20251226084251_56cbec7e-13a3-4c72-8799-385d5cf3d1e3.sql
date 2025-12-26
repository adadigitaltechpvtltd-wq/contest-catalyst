-- Enable REPLICA IDENTITY FULL for wallet_transactions to support realtime updates
ALTER TABLE public.wallet_transactions REPLICA IDENTITY FULL;

-- Add table to realtime publication (if not already added)
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;