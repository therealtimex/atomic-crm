-- Create a function to get the latest applied migration timestamp
-- This queries Supabase's internal migration tracking table
CREATE OR REPLACE FUNCTION public.get_latest_migration_timestamp()
RETURNS TEXT AS $$
DECLARE
  latest_version TEXT;
BEGIN
  SELECT version INTO latest_version
  FROM supabase_migrations.schema_migrations
  ORDER BY version DESC
  LIMIT 1;

  RETURN latest_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_latest_migration_timestamp() TO authenticated;

COMMENT ON FUNCTION public.get_latest_migration_timestamp() IS
  'Returns the latest migration timestamp from Supabase internal tracking table';
