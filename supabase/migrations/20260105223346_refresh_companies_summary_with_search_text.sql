-- Recreate companies_summary view to include the new search_text column
-- The view needs to be dropped and recreated because it uses c.* which doesn't
-- automatically pick up new columns added to the companies table

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
