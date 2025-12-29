-- ============================================================================
-- Validation Session Tracking (Alternative to Advisory Locks)
-- ============================================================================
-- Provides visibility into active validation loops

-- 0. Enable required extensions
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1. Create validation_sessions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS validation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  total_contacts integer,
  validated_count integer DEFAULT 0,
  iteration integer DEFAULT 0,
  error_message text,
  config jsonb,

  -- Constraint: Only one running session at a time
  CONSTRAINT only_one_running EXCLUDE USING gist (
    status WITH =
  ) WHERE (status = 'running')
);

CREATE INDEX idx_validation_sessions_status ON validation_sessions(status);
CREATE INDEX idx_validation_sessions_started ON validation_sessions(started_at DESC);

COMMENT ON TABLE validation_sessions IS
'Tracks active and historical email validation loops. Prevents concurrent loops.';

-- 2. Function to start a new session
-- ============================================================================

CREATE OR REPLACE FUNCTION start_validation_session(
  p_total_contacts integer,
  p_config jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id uuid;
BEGIN
  -- Try to insert new session (will fail if one already running)
  INSERT INTO validation_sessions (total_contacts, config, status)
  VALUES (p_total_contacts, p_config, 'running')
  RETURNING id INTO v_session_id;

  RETURN v_session_id;

EXCEPTION
  WHEN exclusion_violation THEN
    -- Another session is already running
    RAISE EXCEPTION 'A validation session is already running';
END;
$$;

-- 3. Function to update session progress
-- ============================================================================

CREATE OR REPLACE FUNCTION update_validation_session(
  p_session_id uuid,
  p_validated_count integer,
  p_iteration integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE validation_sessions
  SET
    validated_count = p_validated_count,
    iteration = p_iteration
  WHERE id = p_session_id
    AND status = 'running';
END;
$$;

-- 4. Function to complete session
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_validation_session(
  p_session_id uuid,
  p_status text DEFAULT 'completed',
  p_error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE validation_sessions
  SET
    completed_at = now(),
    status = p_status,
    error_message = p_error_message
  WHERE id = p_session_id;
END;
$$;

-- 5. Cleanup old sessions (keep last 30 days)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_validation_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM validation_sessions
  WHERE completed_at < now() - interval '30 days'
    AND status != 'running';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Schedule cleanup (optional)
-- SELECT cron.schedule(
--   'cleanup-validation-sessions',
--   '0 3 * * 0', -- Weekly on Sunday at 3 AM
--   $$ SELECT cleanup_old_validation_sessions(); $$
-- );

-- 6. Monitoring queries
-- ============================================================================

-- Check if validation is currently running:
-- SELECT * FROM validation_sessions WHERE status = 'running';

-- View recent validation history:
-- SELECT
--   id,
--   started_at,
--   completed_at,
--   status,
--   validated_count,
--   iteration,
--   EXTRACT(EPOCH FROM (completed_at - started_at))/60 as duration_minutes
-- FROM validation_sessions
-- ORDER BY started_at DESC
-- LIMIT 10;

-- Average validation duration:
-- SELECT
--   AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60) as avg_duration_minutes,
--   MAX(EXTRACT(EPOCH FROM (completed_at - started_at))/60) as max_duration_minutes
-- FROM validation_sessions
-- WHERE status = 'completed'
--   AND completed_at > now() - interval '30 days';
