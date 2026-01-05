-- Add search_text column to companies table for smart multi-word search
-- This migration ensures the column exists even if it wasn't added before

-- Step 1: Add search_text column to companies table (with IF NOT EXISTS check via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'companies'
    AND column_name = 'search_text'
  ) THEN
    EXECUTE '
      ALTER TABLE companies
      ADD COLUMN search_text TEXT
      GENERATED ALWAYS AS (
        COALESCE(name, '''') || '' '' ||
        COALESCE(phone_number, '''') || '' '' ||
        COALESCE(website, '''') || '' '' ||
        COALESCE(city, '''') || '' '' ||
        COALESCE("stateAbbr", '''') || '' '' ||
        COALESCE(zipcode, '''') || '' '' ||
        COALESCE(description, '''')
      ) STORED
    ';
  END IF;
END $$;

-- Step 2: Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_companies_search_text
ON companies USING gin (to_tsvector('simple', search_text));

-- Step 3: Recreate companies_summary view to include search_text
DROP VIEW IF EXISTS companies_summary CASCADE;

CREATE VIEW companies_summary
  WITH (security_invoker=on)
  AS
SELECT
  c.*,
  -- Existing aggregations
  COUNT(DISTINCT d.id) as nb_deals,
  COUNT(DISTINCT co.id) as nb_contacts,
  COUNT(DISTINCT cn.id) as nb_notes,
  COUNT(DISTINCT t.id) FILTER (WHERE t.done_date IS NULL) as nb_tasks,
  COALESCE(SUM(d.amount), 0) as total_deal_amount,

  -- New aggregations for heartbeat context
  MAX(cn.date) as last_note_date,
  MAX(d.updated_at) as last_deal_activity,
  MAX(t.due_date) as last_task_activity,

  -- Computed engagement indicator (days since last activity)
  LEAST(
    COALESCE(EXTRACT(EPOCH FROM (now() - MAX(cn.date)))/86400, 999999),
    COALESCE(EXTRACT(EPOCH FROM (now() - MAX(d.updated_at)))/86400, 999999),
    COALESCE(EXTRACT(EPOCH FROM (now() - MAX(t.due_date)))/86400, 999999)
  )::integer as days_since_last_activity

FROM companies c
LEFT JOIN deals d ON c.id = d.company_id
LEFT JOIN contacts co ON c.id = co.company_id
LEFT JOIN "companyNotes" cn ON c.id = cn.company_id
LEFT JOIN tasks t ON co.id = t.contact_id
GROUP BY c.id;

COMMENT ON COLUMN companies.search_text IS 'Concatenated searchable fields for smart multi-word search';
