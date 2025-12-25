-- Schedule auto-complete-contests to run every hour
SELECT cron.schedule(
  'auto-complete-contests-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://xoompskrczzucsohfcyy.supabase.co/functions/v1/auto-complete-contests',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvb21wc2tyY3p6dWNzb2hmY3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NjMxMjIsImV4cCI6MjA4MjAzOTEyMn0.CXP5OTLpct1SjcdDvMfYHnLgN0_B1CeQ0xCqtGYHnGk"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);