-- Enable RLS
ALTER TABLE public.validation_sessions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read sessions
-- This allows salespeople/admins to see validation history
CREATE POLICY "Enable select for authenticated users"
ON public.validation_sessions
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert/update sessions
-- This is required for starting and tracking validation loops via UI
CREATE POLICY "Enable all for authenticated users"
ON public.validation_sessions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Revoke anonymous execution of webhook enqueuing
-- This prevents unauthenticated users from injecting events into the queue
REVOKE EXECUTE ON FUNCTION public.enqueue_webhook_event(text, jsonb) FROM anon;
