# External Heartbeat Validation

This document describes how RealTimeX CRM validates external contact data using scheduled Edge Functions.

## Overview

External heartbeat validation runs **asynchronously** via cron jobs to check:
- **Email validity** (deliverability, spam risk, syntax)
- **LinkedIn profile status** (active, private, deleted)
- **Company health** (future: domain status, business registry, etc.)

This keeps contact data fresh without blocking user operations.

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│  pg_cron    │─────▶│ Edge Function│─────▶│ External APIs   │
│  (Schedule) │      │  (Validate)  │      │ (ZeroBounce,    │
└─────────────┘      └──────────────┘      │  LinkedIn, etc.)│
                            │               └─────────────────┘
                            ▼
                     ┌──────────────┐
                     │   contacts   │
                     │   table      │
                     └──────────────┘
```

## Setup Instructions

### 1. Deploy Edge Functions

```bash
# Email validation
supabase functions deploy validate-contact-emails --no-verify-jwt

# LinkedIn validation
supabase functions deploy validate-linkedin-profiles --no-verify-jwt
```

### 2. Configure API Keys (Optional but Recommended)

For production use, integrate with third-party validation services:

#### Email Validation Providers

**Default (No API Key):** Uses **email-validator-js** library
- ✅ Free, no API key needed
- ✅ Performs syntax, DNS MX, SMTP verification
- ✅ Detects disposable emails, typos, free providers
- ⚠️ Requires BSL 1.1 commercial license for revenue-generating SaaS

**Optional Third-Party APIs** (for highest accuracy):
- **ZeroBounce** (recommended): https://www.zerobounce.net/
- **Hunter.io**: https://hunter.io/email-verifier
- **EmailListVerify**: https://www.emaillistverify.com/
- **Abstract API**: https://www.abstractapi.com/email-verification-validation-api

Set API key as environment variable:
```bash
# In Supabase Dashboard → Edge Functions → Environment Variables
EMAIL_VALIDATION_API_KEY=your_api_key_here
```

**Validation Tier Decision:**
- No API key → Uses email-validator-js (advanced, free)
- API key present → Uses third-party API with email-validator-js fallback

#### LinkedIn Validation Providers
- **Proxycurl**: https://nubela.co/proxycurl/
- **RapidAPI LinkedIn endpoints**: https://rapidapi.com/

```bash
LINKEDIN_API_KEY=your_api_key_here
```

### 3. Apply Cron Migration

```bash
supabase migration up --local  # Test locally first
supabase db push              # Deploy to production
```

### 4. Configure Database Settings

After deploying the migration, set your Supabase credentials:

```sql
-- Run in Supabase SQL Editor
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';
ALTER DATABASE postgres SET app.settings.supabase_service_role_key = 'your-service-role-key';
```

**Security Note**: The service role key is stored in PostgreSQL settings and only accessible to database functions. Never expose it in client code.

### 5. Verify Cron Jobs

Check if cron jobs are scheduled:

```sql
SELECT * FROM cron.job WHERE jobname LIKE 'validate%';
```

Expected output:
```
jobid | schedule   | command                | jobname
------+------------+------------------------+--------------------------------
1     | 0 2 * * *  | SELECT net.http_post...| validate-contact-emails-daily
```

## Manual Testing

### Test Email Validation

```bash
# Via curl (replace with your Supabase URL and anon key)
curl -X POST \
  'https://your-project.supabase.co/functions/v1/validate-contact-emails?batch_size=10' \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Test LinkedIn Validation

```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/validate-linkedin-profiles?batch_size=10' \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Trigger via SQL

```sql
-- Manually trigger email validation
SELECT net.http_post(
  url := current_setting('app.settings.supabase_url', true) || '/functions/v1/validate-contact-emails?batch_size=5',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
  )::jsonb
);
```

## Monitoring

### View Cron Job History

```sql
-- Last 10 runs
SELECT
  jobname,
  runid,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname LIKE 'validate%')
ORDER BY start_time DESC
LIMIT 10;
```

### Check Validation Stats

```sql
-- Email validation summary
SELECT
  email_validation_status,
  COUNT(*) as count
FROM contacts
WHERE email IS NOT NULL
GROUP BY email_validation_status;

-- Last validation time
SELECT
  MAX(external_heartbeat_checked_at) as last_validation,
  COUNT(*) FILTER (WHERE external_heartbeat_checked_at > now() - interval '7 days') as validated_last_week
FROM contacts
WHERE email IS NOT NULL;
```

## Configuration Options

### Batch Size

Control how many contacts are validated per run:

```sql
-- Update cron job to validate 100 emails per run
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'validate-contact-emails-daily'),
  schedule := '0 2 * * *',
  command := $$
    SELECT net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/validate-contact-emails?batch_size=100',
      ...
    );
  $$
);
```

### Schedule Frequency

```sql
-- Run every 6 hours
SELECT cron.alter_job(..., schedule := '0 */6 * * *');

-- Run weekly on Mondays at 3 AM
SELECT cron.alter_job(..., schedule := '0 3 * * 1');

-- Run monthly on the 1st at midnight
SELECT cron.alter_job(..., schedule := '0 0 1 * *');
```

### Staleness Threshold

Contacts are re-validated if `external_heartbeat_checked_at` is older than threshold:

```bash
# Re-validate emails older than 60 days
?batch_size=50&days_stale=60

# Re-validate LinkedIn profiles older than 180 days
?batch_size=50&days_stale=180
```

## Cost Optimization

### Free Tier Limits
- **Basic validation** (no API): Free, but less accurate
- **ZeroBounce**: 100 free credits/month, then $0.008/email
- **Proxycurl**: Pay-as-you-go, ~$0.01/profile

### Optimization Strategies

1. **Prioritize high-value contacts**: Add `WHERE` filter for VIP contacts
2. **Incremental validation**: Start with small batches (10-50)
3. **Longer staleness window**: Re-validate quarterly (90 days) instead of monthly
4. **Smart scheduling**: Run during off-peak hours to avoid rate limits

Example: Only validate contacts with recent activity
```sql
-- Modify Edge Function query
.not('email', 'is', null)
.gte('last_seen', new Date(Date.now() - 90 * 86400000).toISOString()) -- Active in last 90 days
.or(`email_validation_status.is.null,...`)
```

## Troubleshooting

### Cron job not running

```sql
-- Check pg_cron extension
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- If missing, enable it
CREATE EXTENSION pg_cron;
```

### Edge Function errors

```bash
# View Edge Function logs
supabase functions logs validate-contact-emails --project-ref your-project-ref

# Test locally
supabase functions serve validate-contact-emails
curl http://localhost:54321/functions/v1/validate-contact-emails
```

### Rate limiting

If you hit API rate limits, increase delay between requests:

```typescript
// In Edge Function
await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
```

## Future Enhancements

- [ ] **Company domain validation** (DNS, SSL, business registry)
- [ ] **Phone number validation** (Twilio Lookup API)
- [ ] **Webhooks for bounced emails** (integrate with email provider)
- [ ] **ML-based re-validation scheduling** (smart intervals based on contact activity)
- [ ] **Parallel validation** (use worker pool for faster processing)

## References

- [Supabase pg_cron documentation](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [ZeroBounce API docs](https://www.zerobounce.net/docs/)
- [Email validation best practices](https://www.validity.com/blog/email-validation-best-practices/)
