-- ============================================================================
-- PostgreSQL Advisory Locks for Distributed Coordination
-- ============================================================================
-- Prevents concurrent validation loops from running simultaneously

-- 1. Create RPC wrapper for pg_try_advisory_lock
-- ============================================================================

CREATE OR REPLACE FUNCTION pg_try_advisory_lock(lock_id bigint)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT pg_try_advisory_lock(lock_id);
$$;

-- Grant execute to authenticated users (edge functions use service role)
GRANT EXECUTE ON FUNCTION pg_try_advisory_lock(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION pg_try_advisory_lock(bigint) TO service_role;

COMMENT ON FUNCTION pg_try_advisory_lock IS
'Try to acquire an advisory lock. Returns true if acquired, false if already held.
Used to prevent concurrent validation loops.';

-- 2. Create RPC wrapper for pg_advisory_unlock
-- ============================================================================

CREATE OR REPLACE FUNCTION pg_advisory_unlock(lock_id bigint)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT pg_advisory_unlock(lock_id);
$$;

GRANT EXECUTE ON FUNCTION pg_advisory_unlock(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION pg_advisory_unlock(bigint) TO service_role;

COMMENT ON FUNCTION pg_advisory_unlock IS
'Release an advisory lock. Returns true if released, false if not held.';

-- 3. Create helper to check current locks
-- ============================================================================

CREATE OR REPLACE FUNCTION get_active_advisory_locks()
RETURNS TABLE(
  lock_id bigint,
  lock_type text,
  granted boolean,
  pid integer
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    objid as lock_id,
    locktype as lock_type,
    granted,
    pid
  FROM pg_locks
  WHERE locktype = 'advisory'
  ORDER BY objid;
$$;

GRANT EXECUTE ON FUNCTION get_active_advisory_locks() TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_advisory_locks() TO service_role;

COMMENT ON FUNCTION get_active_advisory_locks IS
'View all currently held advisory locks. Useful for debugging.';

-- 4. Usage Examples
-- ============================================================================

-- Check if validation lock is currently held:
-- SELECT * FROM get_active_advisory_locks() WHERE lock_id = 123456789;

-- Manually acquire lock (testing):
-- SELECT pg_try_advisory_lock(123456789);

-- Manually release lock (testing):
-- SELECT pg_advisory_unlock(123456789);

-- Release ALL advisory locks (emergency):
-- SELECT pg_advisory_unlock_all();
