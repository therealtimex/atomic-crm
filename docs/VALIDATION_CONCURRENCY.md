# Preventing Overlapping Validation Cycles

## The Problem

**Validation cycles can take longer than cron frequency:**

```
Scenario:
- 50,000 contacts to validate
- Validation rate: ~100/minute (throttled)
- Total time: 500 minutes (~8 hours)
- Cron frequency: Every 6 hours

Timeline:
0h:  Cron #1 starts → Loop running
6h:  Cron #2 starts → Loop running (duplicate!)
8h:  Cron #1 completes
12h: Cron #3 starts → Loop running
14h: Cron #2 completes
```

**Consequences:**
- ❌ Duplicate validations (same contact validated twice)
- ❌ Resource waste (2x edge function costs)
- ❌ Rate limit violations (double API calls)
- ❌ Database contention (concurrent updates)
- ❌ Unpredictable results (which loop "wins"?)

---

## Solution 1: Advisory Locks (Recommended) 🔒

**Use PostgreSQL advisory locks for distributed coordination.**

### **How It Works**

```
Cron #1 → Try acquire lock(123456789) → Success ✅ → Start validation
Cron #2 → Try acquire lock(123456789) → Fail ❌ → Exit gracefully
Cron #1 → Completes validation → Release lock
Cron #3 → Try acquire lock(123456789) → Success ✅ → Start validation
```

**PostgreSQL Advisory Locks:**
- Session-level locks (auto-release on disconnect)
- Non-blocking (`pg_try_advisory_lock` returns immediately)
- Lightweight (no table overhead)
- Distributed (works across multiple workers)

### **Implementation**

The lock check is **automatic** in the v2 function:

```typescript
// At start of each validation loop
const LOCK_ID = 123456789; // Unique ID for email validation

const { data: lockAcquired } = await supabaseAdmin
  .rpc('pg_try_advisory_lock', { lock_id: LOCK_ID });

if (!lockAcquired) {
  console.warn('Another validation loop is already running');
  return { skipped: true };  // Exit gracefully
}

// Continue with validation...

// Lock auto-releases when function completes
```

### **Behavior**

**First cron trigger:**
```
2:00 AM → Lock acquired ✅
        → Validation starts (iterations 0-99)
        → 8 hours later: completes
        → Lock released 🔓
```

**Second cron trigger (during first loop):**
```
8:00 AM → Lock already held ❌
        → Logs: "Another validation loop is running"
        → Returns 409 Conflict
        → No duplicate work ✅
```

**Third cron trigger (after first completes):**
```
2:00 PM → Lock acquired ✅
        → Validation starts (new cycle)
```

### **Monitoring**

**Check if lock is currently held:**
```sql
SELECT * FROM get_active_advisory_locks()
WHERE lock_id = 123456789;
```

**View all advisory locks:**
```sql
SELECT * FROM get_active_advisory_locks();
```

**Manually release lock (emergency):**
```sql
SELECT pg_advisory_unlock(123456789);
```

### **Advantages**

✅ **Zero overhead** - No table writes, pure in-memory
✅ **Automatic cleanup** - Locks auto-release on disconnect
✅ **Simple** - One-line check at function start
✅ **Fast** - Non-blocking check (~1ms)
✅ **Reliable** - PostgreSQL guarantees atomicity

### **Disadvantages**

⚠️ **Limited visibility** - Can't see lock history
⚠️ **No progress tracking** - Can't see iteration count
⚠️ **Manual emergency unlock** - Need SQL to force release

---

## Solution 2: Session Tracking Table (Alternative) 📊

**Use a database table to track active validation sessions.**

### **How It Works**

```sql
CREATE TABLE validation_sessions (
  id uuid PRIMARY KEY,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text CHECK (status IN ('running', 'completed', 'failed')),
  validated_count integer,
  iteration integer,
  -- Constraint: Only one 'running' session at a time
  CONSTRAINT only_one_running EXCLUDE ...
);
```

**Flow:**
1. Function tries to insert new session with `status='running'`
2. If another session is already `running`, insert fails (exclusion constraint)
3. Function exits gracefully
4. When loop completes, mark session as `completed`

### **Implementation**

```typescript
// At start of validation
const { data: session, error } = await supabaseAdmin
  .rpc('start_validation_session', {
    p_total_contacts: queueSize,
    p_config: config
  });

if (error?.code === '23P01') {  // Exclusion violation
  console.warn('Another validation session is running');
  return { skipped: true };
}

const sessionId = session;

// During validation (each iteration)
await supabaseAdmin.rpc('update_validation_session', {
  p_session_id: sessionId,
  p_validated_count: totalValidated,
  p_iteration: iteration
});

// At end
await supabaseAdmin.rpc('complete_validation_session', {
  p_session_id: sessionId,
  p_status: 'completed'
});
```

### **Monitoring**

**Check if validation is running:**
```sql
SELECT * FROM validation_sessions
WHERE status = 'running';
```

**View progress of current session:**
```sql
SELECT
  id,
  started_at,
  validated_count,
  iteration,
  total_contacts,
  ROUND(validated_count::numeric / total_contacts * 100, 2) as pct_complete,
  EXTRACT(EPOCH FROM (now() - started_at))/60 as elapsed_minutes
FROM validation_sessions
WHERE status = 'running';
```

**View validation history:**
```sql
SELECT
  started_at,
  completed_at,
  validated_count,
  iteration,
  EXTRACT(EPOCH FROM (completed_at - started_at))/60 as duration_minutes,
  status
FROM validation_sessions
WHERE completed_at > now() - interval '7 days'
ORDER BY started_at DESC;
```

**Average validation duration:**
```sql
SELECT
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60) as avg_minutes,
  MAX(EXTRACT(EPOCH FROM (completed_at - started_at))/60) as max_minutes
FROM validation_sessions
WHERE status = 'completed'
  AND completed_at > now() - interval '30 days';
```

### **Advantages**

✅ **Full visibility** - See current progress, history, duration
✅ **Monitoring** - Dashboard-ready metrics
✅ **Debugging** - Failed sessions preserved with errors
✅ **Analytics** - Track validation trends over time

### **Disadvantages**

⚠️ **Table overhead** - Writes to database
⚠️ **Manual cleanup** - Old sessions need periodic deletion
⚠️ **More complex** - Multiple RPCs (start, update, complete)

---

## Comparison

| Feature | Advisory Locks | Session Tracking |
|---------|----------------|------------------|
| **Setup complexity** | ✅ Simple (one RPC) | ⚠️ Complex (table + 4 RPCs) |
| **Performance** | ✅ Instant (in-memory) | ⚠️ DB writes on each update |
| **Visibility** | ❌ No history | ✅ Full history + progress |
| **Monitoring** | ❌ Limited | ✅ Dashboard-ready |
| **Cleanup** | ✅ Automatic | ⚠️ Manual (cron job) |
| **Debugging** | ⚠️ Hard (no logs) | ✅ Easy (persisted errors) |
| **Overhead** | ✅ Zero | ⚠️ DB writes |

---

## Recommendation

### **Use Advisory Locks if:**
- You want simplicity (5 lines of code)
- You don't need detailed progress tracking
- You trust automatic cleanup
- Performance is critical

### **Use Session Tracking if:**
- You need visibility into progress
- You want historical analytics
- You need debugging capabilities
- You're building a dashboard

### **Hybrid Approach:**
Use **both**:
- Advisory locks for immediate concurrency control
- Session tracking for monitoring/analytics (optional updates)

```typescript
// 1. Acquire lock (required)
if (!await tryAcquireLock()) {
  return { skipped: true };
}

// 2. Create session (optional, for monitoring)
const sessionId = await startSession();

// ... validation ...

// 3. Update progress (optional, periodically)
if (iteration % 10 === 0) {
  await updateSession(sessionId, progress);
}

// 4. Complete session
await completeSession(sessionId);
// Lock auto-releases
```

---

## Alternative: Dynamic Cron Scheduling

**Adjust cron frequency based on validation duration.**

### **Approach**

1. **Measure validation duration** (from session tracking)
2. **Calculate safe interval** (duration + buffer)
3. **Update cron schedule** dynamically

```sql
-- Calculate average validation duration
SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/3600) as avg_hours
FROM validation_sessions
WHERE status = 'completed';

-- If avg = 8 hours, schedule every 10 hours (25% buffer)
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'validate-contact-emails-smart'),
  schedule := '0 */10 * * *'  -- Every 10 hours
);
```

### **Advantages**

✅ **Adaptive** - Adjusts to data growth
✅ **No overlaps** - Guaranteed separation

### **Disadvantages**

⚠️ **Complexity** - Requires automated schedule management
⚠️ **Inflexible** - Fixed schedule (not self-triggering)
⚠️ **Delayed updates** - If data grows, validation lags

---

## Best Practices

### **1. Set Realistic Cron Frequency**

```sql
-- Conservative: Daily (gives 24h for completion)
'0 2 * * *'

-- Aggressive: Every 6 hours (only if validation < 5h)
'0 */6 * * *'

-- Cautious: Weekly (for very large databases)
'0 2 * * 0'
```

**Rule of thumb:** Cron interval ≥ 2× validation duration

### **2. Monitor Validation Duration**

Track how long validation takes:
```sql
SELECT
  date_trunc('day', started_at) as date,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/3600) as avg_hours
FROM validation_sessions
WHERE status = 'completed'
GROUP BY date_trunc('day', started_at)
ORDER BY date DESC
LIMIT 7;
```

If duration grows, adjust:
- Increase `batchSize`
- Decrease `delayBetweenEmails`
- Reduce cron frequency

### **3. Set Up Alerts**

Alert if validation takes too long:
```sql
-- Find sessions running > 12 hours
SELECT * FROM validation_sessions
WHERE status = 'running'
  AND started_at < now() - interval '12 hours';
```

### **4. Emergency Stop**

If validation gets stuck:

**With advisory locks:**
```sql
SELECT pg_advisory_unlock(123456789);
```

**With session tracking:**
```sql
UPDATE validation_sessions
SET status = 'failed', error_message = 'Manually stopped'
WHERE status = 'running';
```

---

## Summary

**Problem:** Validation cycles can overlap if duration > cron frequency

**Solutions:**
1. **Advisory Locks** ✅ - Simple, fast, automatic (recommended)
2. **Session Tracking** 📊 - Visible, debuggable, analytical
3. **Dynamic Cron** ⏰ - Adaptive but complex

**Implementation:**
- Advisory locks are **already implemented** in v2 function
- Session tracking is **optional** (for monitoring)
- Both can coexist (hybrid approach)

**Your 8-day validation cycle is now safe** - concurrent loops are prevented! 🎉
