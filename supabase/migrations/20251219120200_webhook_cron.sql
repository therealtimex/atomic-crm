-- Enable pg_cron extension if not already enabled
create extension if not exists pg_cron with schema extensions;

-- Schedule webhook dispatcher to run every minute
-- Note: This uses Supabase's http extension to call the Edge Function
select cron.schedule(
    'webhook-dispatcher',
    '* * * * *', -- Every minute
    $$
    select
      net.http_post(
          url:='https://' || current_setting('app.settings.supabase_url', true) || '/functions/v1/webhook-dispatcher',
          headers:=jsonb_build_object(
              'Content-Type','application/json',
              'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
          ),
          body:='{}'::jsonb
      ) as request_id;
    $$
);

-- Note: To configure this cron job properly, you need to set the following settings in your Supabase project:
-- ALTER DATABASE postgres SET app.settings.supabase_url = 'your-project-ref.supabase.co';
-- ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';
--
-- Alternatively, the webhook dispatcher can be called manually or via a separate cron service like GitHub Actions or a cloud scheduler.
