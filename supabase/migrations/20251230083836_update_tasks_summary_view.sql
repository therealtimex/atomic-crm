-- Update tasks_summary view to support tasks linked to contacts, companies, or deals
CREATE OR REPLACE VIEW public.tasks_summary AS
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
