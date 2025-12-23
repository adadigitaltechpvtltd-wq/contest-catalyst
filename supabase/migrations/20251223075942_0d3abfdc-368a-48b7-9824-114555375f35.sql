-- Fix 1: Replace overly permissive notification INSERT policy
-- Drop the current policy that allows any authenticated user to insert for any user_id
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create new policy: Only admins/moderators can create notifications for anyone
CREATE POLICY "Admins can create notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Fix 2: Create separate payment_details table for sensitive financial data
CREATE TABLE IF NOT EXISTS public.payment_details (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  upi_id TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on payment_details
ALTER TABLE public.payment_details ENABLE ROW LEVEL SECURITY;

-- Users can only view/manage their own payment details
CREATE POLICY "Users can manage own payment details"
ON public.payment_details FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view payment details for processing payments
CREATE POLICY "Admins can view payment details"
ON public.payment_details FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_payment_details_updated_at
BEFORE UPDATE ON public.payment_details
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing financial data from profiles to payment_details
INSERT INTO public.payment_details (user_id, upi_id, bank_account_number, bank_ifsc, created_at, updated_at)
SELECT 
  id as user_id,
  upi_id,
  bank_account_number,
  bank_ifsc,
  created_at,
  updated_at
FROM public.profiles
WHERE upi_id IS NOT NULL 
   OR bank_account_number IS NOT NULL 
   OR bank_ifsc IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET
  upi_id = EXCLUDED.upi_id,
  bank_account_number = EXCLUDED.bank_account_number,
  bank_ifsc = EXCLUDED.bank_ifsc,
  updated_at = now();

-- Fix 3: Restrict profiles SELECT policy - remove the overly permissive one
-- Keep: "Anyone can view leaderboard stats" for leaderboard functionality
-- Keep: "Users can insert own profile" and "Users can update own profile"
-- Replace the broad "Users can view all profiles" with more specific policies

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Users can view their own full profile (including phone)
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- For leaderboard: allow viewing public profile info only via the existing view
-- The leaderboard_stats view already filters to just: full_name, avatar_url, bio, user_id, wins, total_submissions, contests_entered
-- We need a policy that allows reading profiles for leaderboard purposes but not sensitive fields

-- Admins can view all profiles for management
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Note: The "Anyone can view leaderboard stats" policy still exists for the leaderboard view