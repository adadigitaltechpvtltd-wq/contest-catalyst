-- Create database function to auto-complete expired contests
CREATE OR REPLACE FUNCTION public.auto_complete_expired_contests()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_count integer := 0;
  contest_record record;
BEGIN
  -- Find and update all active/voting contests where end_date has passed
  FOR contest_record IN 
    SELECT id, title FROM public.contests 
    WHERE status IN ('active', 'voting')
    AND end_date < NOW()
  LOOP
    UPDATE public.contests
    SET 
      status = 'completed',
      updated_at = NOW()
    WHERE id = contest_record.id;
    
    updated_count := updated_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true, 
    'updated_count', updated_count,
    'processed_at', NOW()
  );
END;
$$;

-- Drop existing cron job that calls the edge function
SELECT cron.unschedule('auto-complete-contests-hourly');

-- Create new cron job that calls the database function directly
SELECT cron.schedule(
  'auto-complete-contests-hourly',
  '0 * * * *',
  $$SELECT public.auto_complete_expired_contests()$$
);