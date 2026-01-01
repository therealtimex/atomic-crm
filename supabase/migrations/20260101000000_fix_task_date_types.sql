-- Fix task date columns to use proper date type instead of timestamp with time zone
-- This prevents timezone conversion issues for date-only values

-- Step 1: Drop views that depend on tasks table
DROP VIEW IF EXISTS public.tasks_summary;
DROP VIEW IF EXISTS public.companies_summary CASCADE;
DROP VIEW IF EXISTS public.contacts_summary;

-- Step 2: Change column types
-- Change due_date from timestamp with time zone to date
-- Extract just the date part from existing timestamps
ALTER TABLE tasks
  ALTER COLUMN due_date TYPE date
  USING due_date::date;

-- Change done_date from timestamp with time zone to date
-- Extract just the date part from existing timestamps (nullable)
ALTER TABLE tasks
  ALTER COLUMN done_date TYPE date
  USING done_date::date;

-- Add comment to clarify the column purpose
COMMENT ON COLUMN tasks.due_date IS 'Date the task is due (date only, no time/timezone)';
COMMENT ON COLUMN tasks.done_date IS 'Date the task was completed (date only, no time/timezone)';

-- Step 3: Recreate contacts_summary view
CREATE VIEW public.contacts_summary
    WITH (security_invoker=on)
    AS
SELECT
    co.*,
    c.name as company_name,
    count(distinct t.id) as nb_tasks
FROM
    public.contacts co
LEFT JOIN
    public.tasks t ON co.id = t.contact_id
LEFT JOIN
    public.companies c ON co.company_id = c.id
GROUP BY
    co.id, c.name;

-- Step 4: Recreate tasks_summary view
CREATE VIEW public.tasks_summary AS
SELECT
    t.id,
    t.contact_id,
    t.company_id,
    t.deal_id,
    t.type,
    t.text,
    t.due_date,
    t.done_date,
    t.sales_id,
    t.priority,
    t.assigned_to,
    t.status,
    t.created_at,
    t.updated_at,
    t.archived,
    t.archived_at,
    -- Contact information (when task is linked to a contact)
    c.first_name as contact_first_name,
    c.last_name as contact_last_name,
    c.email_jsonb->0->>'email' as contact_email,
    -- Company information
    -- Priority: task.company_id (direct link) > contact.company_id (through contact)
    COALESCE(comp_direct.id, comp_via_contact.id) as company_id_computed,
    COALESCE(comp_direct.name, comp_via_contact.name) as company_name,
    -- Deal information (when task is linked to a deal)
    d.name as deal_name,
    -- Assigned sales person
    s_assigned.first_name as assigned_first_name,
    s_assigned.last_name as assigned_last_name,
    -- Creator sales person
    s_creator.first_name as creator_first_name,
    s_creator.last_name as creator_last_name,
    -- Task note count
    count(DISTINCT tn.id) as nb_notes,
    -- Most recent note
    max(tn.date) as last_note_date
FROM public.tasks t
-- Join with contact if task.contact_id is set
LEFT JOIN public.contacts c ON t.contact_id = c.id
-- Join with company via contact's company_id
LEFT JOIN public.companies comp_via_contact ON c.company_id = comp_via_contact.id
-- Join directly with company if task.company_id is set
LEFT JOIN public.companies comp_direct ON t.company_id = comp_direct.id
-- Join with deal if task.deal_id is set
LEFT JOIN public.deals d ON t.deal_id = d.id
-- Join with sales
LEFT JOIN public.sales s_assigned ON t.assigned_to = s_assigned.id
LEFT JOIN public.sales s_creator ON t.sales_id = s_creator.id
LEFT JOIN public."taskNotes" tn ON t.id = tn.task_id
GROUP BY
    t.id,
    c.first_name, c.last_name, c.email_jsonb,
    comp_direct.id, comp_direct.name,
    comp_via_contact.id, comp_via_contact.name,
    d.name,
    s_assigned.first_name, s_assigned.last_name,
    s_creator.first_name, s_creator.last_name;

GRANT SELECT ON public.tasks_summary TO authenticated;

-- Step 5: Recreate companies_summary view
CREATE VIEW public.companies_summary
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
