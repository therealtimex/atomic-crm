-- Add latest_migration_timestamp to schema_migrations table
-- This tracks the timestamp of the most recent migration file applied

ALTER TABLE schema_migrations
ADD COLUMN IF NOT EXISTS latest_migration_timestamp TEXT;

-- Update existing record with the timestamp from the first migration
UPDATE schema_migrations
SET latest_migration_timestamp = '20251229213735'
WHERE version = '0.31.1' AND latest_migration_timestamp IS NULL;

-- Add comment explaining the field
COMMENT ON COLUMN schema_migrations.latest_migration_timestamp IS
  'Timestamp extracted from the latest migration filename (YYYYMMDDHHMMSS format). Used to detect if new migrations are available.';

-- Track this migration in schema_migrations table
INSERT INTO schema_migrations (version, description, latest_migration_timestamp)
VALUES ('0.31.2', 'Add migration timestamp tracking', '20251229232946')
ON CONFLICT (version) DO UPDATE
SET latest_migration_timestamp = EXCLUDED.latest_migration_timestamp;
