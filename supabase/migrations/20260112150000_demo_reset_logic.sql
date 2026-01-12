-- Function to reset demo data
CREATE OR REPLACE FUNCTION public.reset_demo_data()
RETURNS void AS $$
BEGIN
    -- Delete in order of dependencies
    DELETE FROM public.invoice_items;
    DELETE FROM public.invoice_notes;
    DELETE FROM public.invoices;
    DELETE FROM public.task_activity;
    DELETE FROM public.tasks;
    DELETE FROM public.dealNotes;
    DELETE FROM public.deals;
    DELETE FROM public.contactNotes;
    DELETE FROM public.contact_heartbeats;
    DELETE FROM public.contacts;
    DELETE FROM public.companyNotes;
    DELETE FROM public.companies;
    DELETE FROM public.tags;
    
    -- We keep 'sales' and 'business_profile' as they are structural for the demo user
    -- but we can reset them to defaults if needed
    UPDATE public.business_profile 
    SET 
        name = 'RealTimeX Demo Corp',
        email = 'billing@realtimex.ai',
        website = 'https://realtimex.ai',
        address = '123 AI Avenue, San Francisco, CA',
        currency = 'USD'
    WHERE id = 1;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant access to service role
GRANT EXECUTE ON FUNCTION public.reset_demo_data() TO service_role;
