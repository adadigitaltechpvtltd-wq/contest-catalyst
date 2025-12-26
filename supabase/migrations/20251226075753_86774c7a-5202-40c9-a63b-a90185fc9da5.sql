-- Insert missing wallet transactions for winners who don't have them yet
INSERT INTO public.wallet_transactions (user_id, contest_id, submission_id, type, amount, currency, status, notes)
VALUES 
  -- Vinod - cute dog photo contest
  ('5d36a28b-2688-4228-b94e-a49ef21b1561', '4b13a8bc-6c29-480a-bbea-eadadcd4f15c', 'e9a17942-5a6b-4269-8ba0-56a03296b445', 'prize', 5.00, 'USD', 'pending', 'Prize for winning "cute dog photo"'),
  -- Dilip - Best evening photo contest  
  ('0fb87aa5-8e90-4c28-aaef-da20b85a5820', 'e1feb43e-bf24-4552-9d5b-b337c2606d10', 'f2e1ba99-95f3-40e8-aaaf-d0ef39cedabe', 'prize', 500.00, 'USD', 'pending', 'Prize for winning "Best evening photo"');