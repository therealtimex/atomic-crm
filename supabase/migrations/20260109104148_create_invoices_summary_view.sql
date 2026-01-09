-- Invoice Summary View
-- Provides aggregated data for invoice list views

create view "public"."invoices_summary"
    with (security_invoker=on)
    as
select 
    i.*,
    -- Related entity names
    c.name as company_name,
    co.first_name || ' ' || co.last_name as contact_name,
    co.email_jsonb as contact_email,
    d.name as deal_name,
    s.first_name || ' ' || s.last_name as sales_name,
    
    -- Aggregated counts
    count(distinct ii.id) as nb_items,
    count(distinct inn.id) as nb_notes,
    
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
    
from 
    "public"."invoices" i
left join "public"."companies" c on i.company_id = c.id
left join "public"."contacts" co on i.contact_id = co.id
left join "public"."deals" d on i.deal_id = d.id
left join "public"."sales" s on i.sales_id = s.id
left join "public"."invoice_items" ii on i.id = ii.invoice_id
left join "public"."invoice_notes" inn on i.id = inn.invoice_id
group by 
    i.id, c.name, co.first_name, co.last_name, co.email_jsonb, d.name, s.first_name, s.last_name;
