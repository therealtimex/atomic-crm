-- Migration: Make activities table compliant with Standard Activities schema
-- This migration adds fields required by the standard task queue pattern
-- while preserving existing CRM-specific functionality

-- 1. Add missing standard fields to activities table
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS old_data jsonb,                    -- Old data for Update operations
  ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone,  -- When task completed
  ADD COLUMN IF NOT EXISTS error_message text,                -- Error details if failed
  ADD COLUMN IF NOT EXISTS attempted_by text[] DEFAULT '{}'::text[],  -- Machine IDs that attempted this
  ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0,     -- Number of retry attempts
  ADD COLUMN IF NOT EXISTS result jsonb,                      -- Processing result data
  ADD COLUMN IF NOT EXISTS machine_id text;                   -- Machine/worker that claimed task

-- 2. Add index for standard activities pattern (status-based locking)
-- This complements the existing activities_processing_queue_idx
CREATE INDEX IF NOT EXISTS idx_activities_status
  ON public.activities USING btree (processing_status);

CREATE INDEX IF NOT EXISTS idx_activities_locked_at
  ON public.activities USING btree (locked_at)
  WHERE (machine_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_activities_machine_id
  ON public.activities USING btree (machine_id)
  WHERE (machine_id IS NOT NULL);

-- 3. Enable Realtime for activities table (if not already enabled)
-- This allows distributed workers to subscribe to task changes
DO $$
BEGIN
  -- Check if activities is already in the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'activities'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
  END IF;
END $$;

-- 4. Create standard claim_task_compatible function
-- This function provides atomic task claiming with machine-based locking
-- It complements the existing claim_next_pending_activity function
CREATE OR REPLACE FUNCTION claim_task_compatible(
  target_task_id uuid,
  p_machine_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_rows int;
BEGIN
  UPDATE public.activities
  SET
    processing_status = 'processing',  -- Map 'claimed' to 'processing' for CRM compatibility
    machine_id = p_machine_id,
    locked_at = now(),
    retry_count = retry_count + 1
  WHERE id = target_task_id
    AND (processing_status = 'raw' OR processing_status = 'failed')  -- Map 'pending'/'failed'
    AND (machine_id IS NULL OR locked_at < now() - INTERVAL '5 minutes')  -- Stale lock recovery
    AND NOT (p_machine_id = ANY(attempted_by));  -- Prevent retry loops

  GET DIAGNOSTICS updated_rows = ROW_COUNT;

  -- Add machine to attempted_by array if claim succeeded
  IF updated_rows > 0 THEN
    UPDATE public.activities
    SET attempted_by = array_append(attempted_by, p_machine_id)
    WHERE id = target_task_id;
  END IF;

  RETURN updated_rows > 0;
END;
$$;

-- 5. Create helper function to get next claimable task for a machine
-- This is the standard activities pattern equivalent
CREATE OR REPLACE FUNCTION claim_next_task_standard(
  p_machine_id text,
  p_task_type text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  raw_data jsonb,
  type text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task_id uuid;
BEGIN
  -- Find and lock a task atomically
  SELECT a.id INTO v_task_id
  FROM public.activities a
  WHERE
    (processing_status = 'raw' OR processing_status = 'failed')
    AND (machine_id IS NULL OR locked_at < now() - INTERVAL '5 minutes')
    AND NOT (p_machine_id = ANY(attempted_by))
    AND (p_task_type IS NULL OR a.type = p_task_type)
  ORDER BY
    created_at ASC  -- FIFO
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- If we found a task, claim it
  IF v_task_id IS NOT NULL THEN
    IF claim_task_compatible(v_task_id, p_machine_id) THEN
      RETURN QUERY
      SELECT a.id, a.raw_data, a.type
      FROM public.activities a
      WHERE a.id = v_task_id;
    END IF;
  END IF;
END;
$$;

-- 6. Create helper function to mark task as completed
CREATE OR REPLACE FUNCTION complete_task_standard(
  p_task_id uuid,
  p_machine_id text,
  p_result jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_rows int;
BEGIN
  UPDATE public.activities
  SET
    processing_status = 'completed',
    completed_at = now(),
    result = p_result,
    error_message = NULL
  WHERE id = p_task_id
    AND machine_id = p_machine_id;  -- Only machine that claimed it can complete it

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$;

-- 7. Create helper function to mark task as failed
CREATE OR REPLACE FUNCTION fail_task_standard(
  p_task_id uuid,
  p_machine_id text,
  p_error_message text,
  p_max_retries integer DEFAULT 3
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_rows int;
  current_retry_count int;
BEGIN
  -- Get current retry count
  SELECT retry_count INTO current_retry_count
  FROM public.activities
  WHERE id = p_task_id;

  -- Update task status
  UPDATE public.activities
  SET
    processing_status = CASE
      WHEN current_retry_count >= p_max_retries THEN 'failed'
      ELSE 'raw'  -- Allow retry
    END,
    error_message = p_error_message,
    machine_id = NULL,  -- Release lock
    locked_at = NULL
  WHERE id = p_task_id
    AND machine_id = p_machine_id;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$;

-- 8. Add comment explaining the hybrid approach
COMMENT ON TABLE public.activities IS 'Unified activity/task table combining CRM activity tracking with standard distributed task queue pattern. Uses both user-based locking (locked_by) for CRM ownership and machine-based locking (machine_id) for distributed processing.';

COMMENT ON COLUMN public.activities.locked_by IS 'UUID of auth user who owns/processes this activity (CRM context)';
COMMENT ON COLUMN public.activities.machine_id IS 'Text identifier of machine/worker that claimed this task (distributed queue context)';
COMMENT ON COLUMN public.activities.processing_status IS 'Maps to standard status: raw=pending, processing=claimed, completed=completed, failed=failed';
COMMENT ON COLUMN public.activities.old_data IS 'Previous state for Update operations (for change tracking)';
COMMENT ON COLUMN public.activities.attempted_by IS 'Array of machine IDs that have attempted this task (prevents retry loops)';
