-- Optimize summary views to avoid cartesian product in joins
-- Use correlated subqueries and LATERAL joins instead of LEFT JOIN + GROUP BY for massive performance gains

-- 1. Optimize deals_summary
DROP VIEW IF EXISTS deals_summary CASCADE;
CREATE VIEW deals_summary
  WITH (security_invoker=on)
  AS
SELECT
  d.*,
  (SELECT count(*) FROM invoices i WHERE i.deal_id = d.id) as nb_invoices,
  (SELECT count(*) FROM "dealNotes" dn WHERE dn.deal_id = d.id) as nb_notes
FROM deals d;

-- 2. Optimize contacts_summary
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
  COALESCE(t_stats.nb_tasks, 0) as nb_tasks,
  COALESCE(cn_stats.nb_notes, 0) as nb_notes,
  COALESCE(i_stats.nb_invoices, 0) as nb_invoices,
  COALESCE(t_stats.nb_open_tasks, 0) as nb_open_tasks,
  COALESCE(t_stats.nb_completed_tasks, 0) as nb_completed_tasks,
  CASE
    WHEN COALESCE(t_stats.nb_tasks, 0) > 0
    THEN ROUND(COALESCE(t_stats.nb_completed_tasks, 0)::numeric / t_stats.nb_tasks, 2)
    ELSE 0
  END as task_completion_rate,
  cn_stats.last_note_date,
  t_stats.last_task_activity,
  LEAST(
    COALESCE(EXTRACT(EPOCH FROM (now() - c.last_seen))/86400, 999999),
    COALESCE(EXTRACT(EPOCH FROM (now() - cn_stats.last_note_date))/86400, 999999),
    COALESCE(EXTRACT(EPOCH FROM (now() - t_stats.last_task_activity))/86400, 999999)
  )::integer as days_since_last_activity
FROM contacts c
LEFT JOIN companies comp ON c.company_id = comp.id
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as nb_tasks,
    COUNT(*) FILTER (WHERE done_date IS NULL) as nb_open_tasks,
    COUNT(*) FILTER (WHERE done_date IS NOT NULL) as nb_completed_tasks,
    MAX(due_date) as last_task_activity
  FROM tasks t
  WHERE t.contact_id = c.id
) t_stats ON true
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as nb_notes,
    MAX(date) as last_note_date
  FROM "contactNotes" cn
  WHERE cn.contact_id = c.id
) cn_stats ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) as nb_invoices
  FROM invoices i
  WHERE i.contact_id = c.id
) i_stats ON true;

-- 3. Optimize companies_summary
DROP VIEW IF EXISTS companies_summary CASCADE;
CREATE VIEW companies_summary
  WITH (security_invoker=on)
  AS
SELECT
  c.*,
  COALESCE(d_stats.nb_deals, 0) as nb_deals,
  COALESCE(co_stats.nb_contacts, 0) as nb_contacts,
  COALESCE(cn_stats.nb_notes, 0) as nb_notes,
  COALESCE(i_stats.nb_invoices, 0) as nb_invoices,
  COALESCE(task_stats_agg.nb_tasks, 0) as nb_tasks,
  COALESCE(d_stats.total_deal_amount, 0) as total_deal_amount,
  cn_stats.last_note_date,
  d_stats.last_deal_activity,
  task_stats_agg.last_task_activity,
  LEAST(
    COALESCE(EXTRACT(EPOCH FROM (now() - cn_stats.last_note_date))/86400, 999999),
    COALESCE(EXTRACT(EPOCH FROM (now() - d_stats.last_deal_activity))/86400, 999999),
    COALESCE(EXTRACT(EPOCH FROM (now() - task_stats_agg.last_task_activity))/86400, 999999)
  )::integer as days_since_last_activity
FROM companies c
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as nb_deals,
    SUM(amount) as total_deal_amount,
    MAX(updated_at) as last_deal_activity
  FROM deals d
  WHERE d.company_id = c.id
) d_stats ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) as nb_contacts
  FROM contacts co
  WHERE co.company_id = c.id
) co_stats ON true
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as nb_notes,
    MAX(date) as last_note_date
  FROM "companyNotes" cn
  WHERE cn.company_id = c.id
) cn_stats ON true
LEFT JOIN LATERAL (
  -- Aggregate tasks for all contacts in this company
  SELECT 
    COUNT(*) as nb_tasks,
    MAX(t.due_date) as last_task_activity
  FROM tasks t
  JOIN contacts co ON t.contact_id = co.id
  WHERE co.company_id = c.id AND t.done_date IS NULL
) task_stats_agg ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) as nb_invoices
  FROM invoices i
  WHERE i.company_id = c.id
) i_stats ON true;
