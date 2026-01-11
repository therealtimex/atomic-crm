-- Optimize tasks_summary and invoices_summary views to avoid cartesian product in joins
-- Use correlated subqueries instead of LEFT JOIN + GROUP BY for massive performance gains

-- 1. Optimize tasks_summary
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

-- 2. Optimize invoices_summary
DROP VIEW IF EXISTS invoices_summary CASCADE;
CREATE VIEW invoices_summary
    WITH (security_invoker=on)
    AS
SELECT 
    i.*,
    -- Related entity names
    c.name as company_name,
    co.first_name || ' ' || co.last_name as contact_name,
    co.email_jsonb as contact_email,
    d.name as deal_name,
    s.first_name || ' ' || s.last_name as sales_name,
    
    -- Aggregated counts (Subqueries)
    (SELECT count(*) FROM "invoice_items" ii WHERE ii.invoice_id = i.id) as nb_items,
    (SELECT count(*) FROM "invoice_notes" inn WHERE inn.invoice_id = i.id) as nb_notes,
    
    -- Payment status
    case 
        when i.status = 'paid' then 'Paid'
        when i.status = 'cancelled' then 'Cancelled'
        when i.due_date < now() and i.status != 'paid' then 'Overdue'
        when i.status = 'sent' then 'Sent'
        else 'Draft'
    end as computed_status,
    
    -- Days overdue (if applicable)
    case 
        when i.due_date < now() and i.status != 'paid' and i.status != 'cancelled' 
        then extract(day from now() - i.due_date)::integer
        else 0
    end as days_overdue,
    
    -- Balance remaining
    (i.total - i.amount_paid) as balance_due
    
FROM 
    invoices i
LEFT JOIN companies c ON i.company_id = c.id
LEFT JOIN contacts co ON i.contact_id = co.id
LEFT JOIN deals d ON i.deal_id = d.id
LEFT JOIN sales s ON i.sales_id = s.id;
