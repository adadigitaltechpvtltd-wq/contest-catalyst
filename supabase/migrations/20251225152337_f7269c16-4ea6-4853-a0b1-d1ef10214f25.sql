-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule daily processing of account deletions at midnight UTC
SELECT cron.schedule(
  'process-scheduled-deletions',
  '0 0 * * *',
  $$SELECT public.process_scheduled_deletions()$$
);