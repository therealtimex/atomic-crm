-- Restore missing index column to tasks_summary view
DROP VIEW IF EXISTS tasks_summary CASCADE;
CREATE VIEW tasks_summary
  WITH (security_invoker=on)
  AS
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
    t.index, -- Restore missing column
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
    -- Task note count (Subquery)
    (SELECT count(*) FROM "taskNotes" tn WHERE tn.task_id = t.id) as nb_notes,
    -- Most recent note (Subquery)
    (SELECT max(date) FROM "taskNotes" tn WHERE tn.task_id = t.id) as last_note_date
FROM tasks t
LEFT JOIN contacts c ON t.contact_id = c.id
LEFT JOIN companies comp_via_contact ON c.company_id = comp_via_contact.id
LEFT JOIN companies comp_direct ON t.company_id = comp_direct.id
LEFT JOIN deals d ON t.deal_id = d.id
LEFT JOIN sales s_assigned ON t.assigned_to = s_assigned.id
LEFT JOIN sales s_creator ON t.sales_id = s_creator.id;

GRANT SELECT ON public.tasks_summary TO authenticated;
