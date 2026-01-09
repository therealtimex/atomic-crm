-- Update summary views to include nb_invoices count

-- 1. Update contacts_summary
DROP VIEW IF EXISTS contacts_summary CASCADE;
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
  COUNT(DISTINCT i.id) as nb_invoices,
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
LEFT JOIN invoices i ON c.id = i.contact_id
GROUP BY c.id, comp.name;

-- 2. Update companies_summary
DROP VIEW IF EXISTS companies_summary CASCADE;
CREATE VIEW companies_summary
  WITH (security_invoker=on)
  AS
SELECT
  c.*,
  COUNT(DISTINCT d.id) as nb_deals,
  COUNT(DISTINCT co.id) as nb_contacts,
  COUNT(DISTINCT cn.id) as nb_notes,
  COUNT(DISTINCT i.id) as nb_invoices,
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
LEFT JOIN invoices i ON c.id = i.company_id
GROUP BY c.id;

-- 3. Create deals_summary
DROP VIEW IF EXISTS deals_summary CASCADE;
CREATE VIEW deals_summary
  WITH (security_invoker=on)
  AS
SELECT
  d.*,
  COUNT(DISTINCT i.id) as nb_invoices,
  COUNT(DISTINCT dn.id) as nb_notes
FROM deals d
LEFT JOIN invoices i ON d.id = i.deal_id
LEFT JOIN "dealNotes" dn ON d.id = dn.deal_id
GROUP BY d.id;
