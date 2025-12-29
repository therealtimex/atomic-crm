-- ============================================================================
-- Email Validation Cron Job
-- ============================================================================
-- Schedules periodic email validation via Edge Function
-- Requires pg_cron extension and pg_net for HTTP requests

-- 1. Ensure required extensions are enabled
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Create cron job to validate emails
-- ============================================================================

-- Run daily at 2 AM UTC
-- Validates up to 50 emails per run (configurable via query params)
SELECT cron.schedule(
  'validate-contact-emails-daily',
  '0 2 * * *', -- Every day at 2 AM UTC
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/validate-contact-emails?batch_size=50&days_stale=30',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true),
        'Content-Type', 'application/json'
      )::jsonb
    ) as request_id;
  $$
);

-- 3. Store Supabase credentials in settings (run this manually with your values)
-- ============================================================================

-- IMPORTANT: Replace these placeholders with your actual Supabase URL and service role key
-- Run this in the SQL editor after migration:
--
-- SELECT set_config('app.settings.supabase_url', 'https://your-project.supabase.co', false);
-- SELECT set_config('app.settings.supabase_service_role_key', 'your-service-role-key', false);
--
-- Or use ALTER DATABASE to persist settings:
--
-- ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';
-- ALTER DATABASE postgres SET app.settings.supabase_service_role_key = 'your-service-role-key';

-- 4. View cron job status
-- ============================================================================

-- To check if cron job is scheduled:
-- SELECT * FROM cron.job WHERE jobname = 'validate-contact-emails-daily';

-- To see cron job run history:
-- SELECT * FROM cron.job_run_details WHERE jobid IN (
--   SELECT jobid FROM cron.job WHERE jobname = 'validate-contact-emails-daily'
-- ) ORDER BY start_time DESC LIMIT 10;

-- 5. Manual trigger (for testing)
-- ============================================================================

-- To manually trigger email validation without waiting for cron:
-- SELECT
--   net.http_post(
--     url := current_setting('app.settings.supabase_url', true) || '/functions/v1/validate-contact-emails?batch_size=10',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
--     )::jsonb
--   );

-- 6. Cleanup/Unschedule (if needed)
-- ============================================================================

-- To remove the cron job:
-- SELECT cron.unschedule('validate-contact-emails-daily');
