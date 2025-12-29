-- Create schema_migrations table to track database version
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT
);

-- Enable RLS for schema_migrations
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read schema_migrations
CREATE POLICY "Authenticated users can read schema migrations"
  ON schema_migrations
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only service role can insert/update schema_migrations
-- (CLI migrations will use service role)

-- Insert current version as baseline
INSERT INTO schema_migrations (version, description)
VALUES ('0.31.1', 'Add schema_migrations tracking table')
ON CONFLICT (version) DO NOTHING;

-- Add helpful comment
COMMENT ON TABLE schema_migrations IS 'Tracks applied database migrations and schema version for RealTimeX CRM';
