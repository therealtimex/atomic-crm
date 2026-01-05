-- Add search_text column for smart multi-word search
-- This concatenates all searchable fields into a single text column
-- Allows order-independent word matching (e.g., "Le Dang" or "Dang Le" both work)

-- Step 1: Add search_text column to contacts table
-- This is a generated column that concatenates all searchable fields
ALTER TABLE contacts
ADD COLUMN search_text TEXT
GENERATED ALWAYS AS (
  COALESCE(first_name, '') || ' ' ||
  COALESCE(last_name, '') || ' ' ||
  COALESCE(title, '') || ' ' ||
  COALESCE(background, '') || ' ' ||
  COALESCE(jsonb_path_query_array(email_jsonb, '$[*].email')::text, '') || ' ' ||
  COALESCE(jsonb_path_query_array(phone_jsonb, '$[*].number')::text, '')
) STORED;

-- Step 2: Create index on search_text for better performance
CREATE INDEX idx_contacts_search_text ON contacts USING gin (to_tsvector('simple', search_text));

-- Step 3: Recreate contacts_summary view with search_text column
DROP VIEW IF EXISTS contacts_summary CASCADE;

CREATE VIEW contacts_summary
  WITH (security_invoker=on)
  AS
SELECT
  -- Explicit contact columns
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

  -- Computed full-text search columns (required for search functionality)
  jsonb_path_query_array(c.email_jsonb, '$[*].email')::text as email_fts,
  jsonb_path_query_array(c.phone_jsonb, '$[*].number')::text as phone_fts,

  -- Smart search column (concatenates all searchable fields including company name)
  c.search_text || ' ' || COALESCE(comp.name, '') as search_text,

  -- Company relationship
  comp.name as company_name,

  -- Task and note aggregations
  COUNT(DISTINCT t.id) as nb_tasks,
  COUNT(DISTINCT cn.id) as nb_notes,
  COUNT(DISTINCT t.id) FILTER (WHERE t.done_date IS NULL) as nb_open_tasks,

  -- Task completion metrics
  COUNT(DISTINCT t.id) FILTER (WHERE t.done_date IS NOT NULL) as nb_completed_tasks,
  CASE
    WHEN COUNT(DISTINCT t.id) > 0
    THEN ROUND(COUNT(DISTINCT t.id) FILTER (WHERE t.done_date IS NOT NULL)::numeric / COUNT(DISTINCT t.id), 2)
    ELSE 0
  END as task_completion_rate,

  -- Activity timestamps
  MAX(cn.date) as last_note_date,
  MAX(t.due_date) as last_task_activity,

  -- Computed engagement indicator (days since last activity)
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

COMMENT ON COLUMN contacts.search_text IS 'Concatenated searchable fields for smart multi-word search';
