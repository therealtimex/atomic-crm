-- ============================================================================
-- Smart Email Validation Cron (v2)
-- ============================================================================
-- Self-looping validation that guarantees 100% coverage
-- Adapts to dynamic contact growth

-- 1. Unschedule old cron job (if exists)
-- ============================================================================

SELECT cron.unschedule('validate-contact-emails-daily');

-- 2. Create new smart cron job
-- ============================================================================

-- Run once daily at 2 AM UTC (triggers smart loop)
-- The function will self-trigger until all contacts are validated
SELECT cron.schedule(
  'validate-contact-emails-smart',
  '0 2 * * *', -- Daily at 2 AM UTC
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/validate-contact-emails?iteration=0',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true),
        'Content-Type', 'application/json'
      )::jsonb,
      body := jsonb_build_object(
        'config', jsonb_build_object(
          'batchSize', 100,          -- Emails per batch (increase if you have API quota)
          'maxIterations', 200,      -- Safety limit (200 batches × 100 emails = 20,000 max)
          'delayBetweenEmails', 100, -- 100ms between emails (10 emails/second)
          'delayBetweenBatches', 5000, -- 5 seconds between batches
          'daysStale', 30,           -- Re-validate after 30 days
          'priorityThreshold', 90    -- Validate active contacts (last 90 days) first
        )
      )::jsonb
    ) as request_id;
  $$
);

-- 3. Alternative: High-frequency cron (for urgent validation)
-- ============================================================================

-- Uncomment to run every 6 hours (4x daily)
-- SELECT cron.schedule(
--   'validate-contact-emails-frequent',
--   '0 */6 * * *',
--   $$ ... (same as above) $$
-- );

-- 4. Manual trigger command
-- ============================================================================

-- To manually start validation loop:
/*
SELECT net.http_post(
  url := current_setting('app.settings.supabase_url', true) || '/functions/v1/validate-contact-emails?iteration=0',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
  )::jsonb,
  body := jsonb_build_object(
    'config', jsonb_build_object(
      'batchSize', 50,
      'maxIterations', 100
    )
  )::jsonb
);
*/

-- 5. Monitoring queries
-- ============================================================================

-- Check cron job status
-- SELECT * FROM cron.job WHERE jobname = 'validate-contact-emails-smart';

-- View recent runs
-- SELECT
--   jobname,
--   runid,
--   start_time,
--   end_time,
--   status,
--   return_message
-- FROM cron.job_run_details
-- WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname = 'validate-contact-emails-smart')
-- ORDER BY start_time DESC
-- LIMIT 10;

-- Check validation progress
-- SELECT
--   COUNT(*) FILTER (WHERE email_validation_status IS NULL) as never_validated,
--   COUNT(*) FILTER (WHERE email_validation_status = 'valid') as valid,
--   COUNT(*) FILTER (WHERE email_validation_status = 'risky') as risky,
--   COUNT(*) FILTER (WHERE email_validation_status = 'invalid') as invalid,
--   COUNT(*) FILTER (WHERE external_heartbeat_checked_at < now() - interval '30 days') as stale
-- FROM contacts
-- WHERE email IS NOT NULL;
