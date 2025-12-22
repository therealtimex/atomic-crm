# Large Payload Handling

This document explains how RealTimeX CRM automatically handles large activity payloads to prevent database table bloat and maintain query performance.

## Overview

When activities contain large payloads (> 100KB), storing them inline in the `raw_data` JSONB column can cause:
- Database table bloat
- Slower `FOR UPDATE` scans in the work-stealing mechanism
- Increased storage costs
- Degraded query performance

The Large Payload Handling system automatically detects and migrates large payloads to **Supabase Storage**, keeping only a reference in the database.

## Architecture

### Components

1. **Size Detection Trigger** (`check_payload_size`)
   - Runs on `INSERT` or `UPDATE` of `raw_data`
   - Calculates payload size
   - Marks large payloads (> 100KB) as `pending_move`

2. **Storage Bucket** (`activity-payloads`)
   - Private Supabase Storage bucket
   - Stores JSON payloads with path: `{activity_id}/{timestamp}.json`
   - 10MB max file size limit

3. **Processing Edge Function** (`process-large-payloads`)
   - Runs every 5 minutes via cron
   - Finds activities with `payload_storage_status = 'pending_move'`
   - Uploads payloads to storage
   - Updates database records with storage references

4. **Helper Functions**
   - `get_activity_payload(activity_id)` - Retrieves payload (handles both inline and storage)
   - `move_payload_to_storage(activity_id, path)` - Manually trigger storage migration

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Activity Inserted with Large Payload                        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Trigger Detects Size > 100KB                                │
│    - Sets payload_storage_status = 'pending_move'              │
│    - Stores payload_size_bytes                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Cron Job (Every 5 min) Calls process-large-payloads         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Edge Function Processes Pending Activities                  │
│    - Uploads raw_data to storage                               │
│    - Calls move_payload_to_storage()                           │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Database Updated                                             │
│    - raw_data replaced with storage reference                  │
│    - payload_storage_status = 'in_storage'                     │
│    - storage_path set                                           │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### New Columns in `activities` Table

```sql
ALTER TABLE activities ADD COLUMN
  payload_size_bytes INTEGER,
  payload_storage_status TEXT DEFAULT 'inline',
  storage_path TEXT;
```

**`payload_storage_status` Values:**
- `inline` - Payload is stored in `raw_data` column (< 100KB)
- `pending_move` - Payload is large and queued for migration
- `in_storage` - Payload moved to storage, `raw_data` contains reference

### Storage Reference Format

When a payload is moved to storage, `raw_data` is replaced with:

```json
{
  "payload_type": "storage_ref",
  "storage_path": "12345/1703001234567.json",
  "size_bytes": 524288,
  "moved_at": "2025-12-22T09:42:00Z"
}
```

## Usage

### For Ingestion Providers

**No changes required!** The system is transparent:

1. Insert activities as normal:
   ```typescript
   await supabase.from('activities').insert({
     provider: 'twilio',
     event_type: 'message.received',
     raw_data: largePayload, // Can be any size
     external_id: 'msg_123',
   });
   ```

2. The system automatically:
   - Detects payload size
   - Marks for storage if needed
   - Migrates to storage asynchronously

3. You can check status:
   ```sql
   SELECT id, payload_size_bytes, payload_storage_status, storage_path
   FROM activities
   WHERE id = 12345;
   ```

### Retrieving Payloads

**Option 1: Use Helper Function**

```sql
-- Returns full payload (handles both inline and storage)
SELECT get_activity_payload(12345);
```

For storage-based payloads, this returns metadata:
```json
{
  "payload_type": "storage_ref",
  "storage_path": "12345/1703001234567.json",
  "message": "Payload is in storage. Use Supabase Storage API to retrieve.",
  "url": "/storage/v1/object/activity-payloads/12345/1703001234567.json"
}
```

**Option 2: Direct Storage Download**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

// Get activity record
const { data: activity } = await supabase
  .from('activities')
  .select('storage_path, payload_storage_status')
  .eq('id', 12345)
  .single();

if (activity.payload_storage_status === 'in_storage') {
  // Download from storage
  const { data: payload } = await supabase.storage
    .from('activity-payloads')
    .download(activity.storage_path);

  const payloadJson = await payload.text();
  const rawData = JSON.parse(payloadJson);
}
```

### Manual Migration

Force immediate migration of a large payload:

```sql
-- 1. Call the function (returns original payload)
SELECT move_payload_to_storage(12345, '12345/manual-move.json');

-- 2. Upload the returned payload to storage manually
```

## Configuration

### Adjust Size Threshold

Default threshold is **100KB**. To change:

```sql
-- Update the trigger function
CREATE OR REPLACE FUNCTION check_payload_size()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  payload_size INTEGER;
  size_threshold INTEGER := 204800; -- 200KB threshold
BEGIN
  -- ... rest of function
END;
$$;
```

### Adjust Processing Frequency

Default is **every 5 minutes**. To change:

```sql
-- Update the cron schedule
SELECT cron.schedule(
    'process-large-payloads',
    '*/10 * * * *', -- Every 10 minutes
    $$ ... $$
);
```

### Adjust Batch Size

Default processes **20 activities per run**. To change, update the Edge Function call:

```sql
body:=jsonb_build_object(
    'limit', 50, -- Process 50 at a time
    'max_age_minutes', 1
)
```

## Monitoring

### Check Pending Migrations

```sql
-- Count activities pending storage migration
SELECT COUNT(*) as pending_count
FROM activities
WHERE payload_storage_status = 'pending_move';

-- See oldest pending activity
SELECT id, created_at, payload_size_bytes, provider
FROM activities
WHERE payload_storage_status = 'pending_move'
ORDER BY created_at ASC
LIMIT 1;
```

### Storage Usage

```sql
-- Total storage usage
SELECT
  COUNT(*) as stored_activities,
  SUM(payload_size_bytes) as total_bytes,
  pg_size_pretty(SUM(payload_size_bytes)::bigint) as total_size
FROM activities
WHERE payload_storage_status = 'in_storage';
```

### Processing Logs

Check Edge Function logs in Supabase Dashboard:
- **Dashboard → Edge Functions → process-large-payloads → Logs**

Look for:
```
Processing large payloads (limit: 20, max_age: 5min)
Found 5 activities to process
Processing activity 12345 (524288 bytes) -> 12345/1703001234567.json
Successfully processed activity 12345
Processing complete: {"processed":5,"failed":0,"skipped":0,"errors":[]}
```

## Best Practices

### For Ingestion Providers

1. **Use URLs for media**: Instead of embedding base64-encoded images/videos, use URLs:
   ```json
   {
     "type": "mms",
     "media": [
       {
         "url": "https://api.twilio.com/media/MExxx",
         "content_type": "image/jpeg"
       }
     ]
   }
   ```

2. **Truncate large email bodies**: For emails > 100KB:
   ```json
   {
     "type": "email",
     "subject": "...",
     "body_preview": "First 1000 chars...",
     "full_body_url": "https://your-storage/email-body-123.html"
   }
   ```

3. **Use external storage**: For very large payloads, store in your own S3/GCS and reference:
   ```json
   {
     "type": "webhook",
     "payload_url": "https://s3.amazonaws.com/bucket/payload-123.json"
   }
   ```

### Performance Tips

1. **Monitor pending queue**: Alert if pending count > 100
2. **Increase cron frequency** during high-volume periods
3. **Adjust threshold** based on your workload (100KB is default)
4. **Clean up old storage files** periodically (implement retention policy)

## Troubleshooting

### Payloads Not Being Migrated

1. **Check cron is configured**:
   ```sql
   SELECT current_setting('app.settings.supabase_url', true);
   SELECT current_setting('app.settings.service_role_key', true);
   ```

2. **Manually trigger processing**:
   ```bash
   curl -X POST "https://your-project.supabase.co/functions/v1/process-large-payloads" \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{"limit": 20}'
   ```

3. **Check Edge Function logs** for errors

### Storage Upload Failures

- **Check bucket exists**: `activity-payloads` bucket must be created
- **Check permissions**: Service role must have access to bucket
- **Check file size**: Max 10MB per file

### High Storage Costs

Implement a retention policy to delete old payloads:

```sql
-- Delete storage files older than 90 days
DELETE FROM storage.objects
WHERE bucket_id = 'activity-payloads'
  AND created_at < NOW() - INTERVAL '90 days';

-- Update activities to remove references
UPDATE activities
SET storage_path = NULL,
    raw_data = jsonb_build_object('deleted', true, 'deleted_at', NOW())
WHERE payload_storage_status = 'in_storage'
  AND created_at < NOW() - INTERVAL '90 days';
```

## Migration Guide

The large payload handling system is automatically enabled when you run migrations. No action required!

### Fresh Deployment

```bash
# 1. Push migrations
npx supabase db push

# 2. Deploy Edge Function
npx supabase functions deploy process-large-payloads

# 3. Configure cron settings (if not already done)
npm run supabase:configure:cron
```

### Existing Deployments

If you already have large activities:

```bash
# 1. Push new migrations
npx supabase db push

# 2. Deploy Edge Function
npx supabase functions deploy process-large-payloads

# 3. Mark existing large activities for migration
UPDATE activities
SET payload_storage_status = 'pending_move'
WHERE octet_length(raw_data::text) > 102400
  AND payload_storage_status IS NULL;

# 4. Manually trigger processing to migrate immediately
curl -X POST "https://your-project.supabase.co/functions/v1/process-large-payloads" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -d '{"limit": 100}'
```

## API Reference

### Functions

#### `calculate_payload_size(data JSONB) → INTEGER`

Calculates the byte size of a JSONB payload.

#### `move_payload_to_storage(activity_id BIGINT, storage_path TEXT) → JSONB`

Moves an activity payload to storage and updates the record.

**Returns:**
```json
{
  "success": true,
  "activity_id": 12345,
  "storage_path": "12345/1703001234567.json",
  "payload": {...}
}
```

#### `get_activity_payload(activity_id BIGINT) → JSONB`

Retrieves activity payload, handling both inline and storage references.

### Edge Function Endpoint

**POST** `/functions/v1/process-large-payloads`

**Request Body:**
```json
{
  "limit": 20,          // Max activities to process
  "max_age_minutes": 5  // Only process activities older than this
}
```

**Response:**
```json
{
  "message": "Processing complete",
  "processed": 15,
  "failed": 0,
  "skipped": 0,
  "errors": []
}
```

## Support

For issues or questions:
- **GitHub Issues**: https://github.com/therealtimex/realtimex-crm/issues
- **Documentation**: [AGENTS.md](../AGENTS.md)
