-- Normalize special characters in search_text columns
-- This fixes issues where special Unicode characters (like em-dash, en-dash, non-breaking hyphen)
-- don't match their ASCII equivalents in searches
-- Example: "long‑term" (with Unicode hyphen) should match search for "long-term" (with ASCII hyphen)

-- Step 1: Drop views first (they depend on search_text columns)
DROP VIEW IF EXISTS contacts_summary CASCADE;
DROP VIEW IF EXISTS companies_summary CASCADE;

-- Step 2: Drop existing columns and recreate with normalization
ALTER TABLE contacts DROP COLUMN IF EXISTS search_text;
ALTER TABLE companies DROP COLUMN IF EXISTS search_text;

-- Recreate contacts.search_text with character normalization
ALTER TABLE contacts
ADD COLUMN search_text TEXT
GENERATED ALWAYS AS (
  -- Normalize and remove special characters for fuzzy search
  -- Step 1: Convert Unicode dashes to ASCII hyphen
  -- Step 2: Remove all hyphens for maximum search flexibility
  REPLACE(REPLACE(REPLACE(REPLACE(
    COALESCE(first_name, '') || ' ' ||
    COALESCE(last_name, '') || ' ' ||
    COALESCE(title, '') || ' ' ||
    COALESCE(background, '') || ' ' ||
    COALESCE(jsonb_path_query_array(email_jsonb, '$[*].email')::text, '') || ' ' ||
    COALESCE(jsonb_path_query_array(phone_jsonb, '$[*].number')::text, ''),
    '‑', '-'),  -- Replace non-breaking hyphen (U+2011) with ASCII hyphen
    '–', '-'),  -- Replace en-dash (U+2013) with ASCII hyphen
    '—', '-'),  -- Replace em-dash (U+2014) with ASCII hyphen
    '-', '')    -- Remove all hyphens for fuzzy search
) STORED;

-- Recreate companies.search_text with character normalization
ALTER TABLE companies
ADD COLUMN search_text TEXT
GENERATED ALWAYS AS (
  -- Normalize and remove special characters for fuzzy search
  -- Step 1: Convert Unicode dashes to ASCII hyphen
  -- Step 2: Remove all hyphens for maximum search flexibility
  REPLACE(REPLACE(REPLACE(REPLACE(
    COALESCE(name, '') || ' ' ||
    COALESCE(phone_number, '') || ' ' ||
    COALESCE(website, '') || ' ' ||
    COALESCE(city, '') || ' ' ||
    COALESCE("stateAbbr", '') || ' ' ||
    COALESCE(zipcode, '') || ' ' ||
    COALESCE(description, ''),
    '‑', '-'),  -- Replace non-breaking hyphen (U+2011) with ASCII hyphen
    '–', '-'),  -- Replace en-dash (U+2013) with ASCII hyphen
    '—', '-'),  -- Replace em-dash (U+2014) with ASCII hyphen
    '-', '')    -- Remove all hyphens for fuzzy search
) STORED;

-- Step 3: Recreate indexes
DROP INDEX IF EXISTS idx_contacts_search_text;
DROP INDEX IF EXISTS idx_companies_search_text;

CREATE INDEX idx_contacts_search_text ON contacts USING gin (to_tsvector('simple', search_text));
CREATE INDEX idx_companies_search_text ON companies USING gin (to_tsvector('simple', search_text));

-- Step 4: Recreate contacts_summary view
CREATE VIEW contacts_summary
  WITH (security_invoker=on)
  AS
SELECT
  c.id,
  c.first_name,
  c.last_name,
  c.gender,
  c.title,
  c.email_jsonb,
  c.phone_jsonb,
  c.background,
  c.avatar,
  c.first_seen,
  c.last_seen,
  c.has_newsletter,
  c.status,
  c.tags,
  c.company_id,
  c.sales_id,
  c.linkedin_url,
  c.internal_heartbeat_score,
  c.internal_heartbeat_status,
  c.internal_heartbeat_updated_at,
  c.external_heartbeat_status,
  c.external_heartbeat_checked_at,
  c.email_validation_status,
  c.email_last_bounced_at,
  c.linkedin_profile_status,
  c.employment_verified_at,
  jsonb_path_query_array(c.email_jsonb, '$[*].email')::text as email_fts,
  jsonb_path_query_array(c.phone_jsonb, '$[*].number')::text as phone_fts,
  c.search_text || ' ' || COALESCE(comp.name, '') as search_text,
  comp.name as company_name,
  COUNT(DISTINCT t.id) as nb_tasks,
  COUNT(DISTINCT cn.id) as nb_notes,
  COUNT(DISTINCT t.id) FILTER (WHERE t.done_date IS NULL) as nb_open_tasks,
  COUNT(DISTINCT t.id) FILTER (WHERE t.done_date IS NOT NULL) as nb_completed_tasks,
  CASE
    WHEN COUNT(DISTINCT t.id) > 0
    THEN ROUND(COUNT(DISTINCT t.id) FILTER (WHERE t.done_date IS NOT NULL)::numeric / COUNT(DISTINCT t.id), 2)
    ELSE 0
  END as task_completion_rate,
  MAX(cn.date) as last_note_date,
  MAX(t.due_date) as last_task_activity,
  LEAST(
    COALESCE(EXTRACT(EPOCH FROM (now() - c.last_seen))/86400, 999999),
    COALESCE(EXTRACT(EPOCH FROM (now() - MAX(cn.date)))/86400, 999999),
    COALESCE(EXTRACT(EPOCH FROM (now() - MAX(t.due_date)))/86400, 999999)
  )::integer as days_since_last_activity
FROM contacts c
LEFT JOIN "contactNotes" cn ON c.id = cn.contact_id
LEFT JOIN tasks t ON c.id = t.contact_id
LEFT JOIN companies comp ON c.company_id = comp.id
GROUP BY c.id, comp.name;

-- Step 5: Recreate companies_summary view
CREATE VIEW companies_summary
  WITH (security_invoker=on)
  AS
SELECT
  c.*,
  COUNT(DISTINCT d.id) as nb_deals,
  COUNT(DISTINCT co.id) as nb_contacts,
  COUNT(DISTINCT cn.id) as nb_notes,
  COUNT(DISTINCT t.id) FILTER (WHERE t.done_date IS NULL) as nb_tasks,
  COALESCE(SUM(d.amount), 0) as total_deal_amount,
  MAX(cn.date) as last_note_date,
  MAX(d.updated_at) as last_deal_activity,
  MAX(t.due_date) as last_task_activity,
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

-- Step 6: Add helpful comments
COMMENT ON COLUMN contacts.search_text IS 'Normalized searchable text (hyphens removed for fuzzy search)';
COMMENT ON COLUMN companies.search_text IS 'Normalized searchable text (hyphens removed for fuzzy search)';
