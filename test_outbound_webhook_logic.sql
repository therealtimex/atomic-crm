
DO $$
DECLARE
    v_sales_id bigint;
    v_webhook_id bigint;
    v_contact_id bigint;
    v_queue_count int;
BEGIN
    -- 1. Get a valid sales_id
    SELECT id INTO v_sales_id FROM public.sales LIMIT 1;
    
    IF v_sales_id IS NULL THEN
        RAISE NOTICE 'No sales representative found. Cannot create webhook.';
        RETURN;
    END IF;

    RAISE NOTICE 'Using sales_id: %', v_sales_id;

    -- 2. Create a test webhook
    INSERT INTO public.webhooks (sales_id, created_by_sales_id, name, url, events, is_active, secret)
    VALUES (
        v_sales_id,
        v_sales_id,
        'Test Webhook CLI',
        'https://example.com/test',
        ARRAY['contact.created'],
        true,
        'test_secret'
    ) RETURNING id INTO v_webhook_id;

    RAISE NOTICE 'Created Webhook ID: %', v_webhook_id;

    -- 3. Trigger the event (Create a contact)
    INSERT INTO public.contacts (sales_id, first_name, last_name, email)
    VALUES (
        v_sales_id,
        'Test',
        'Webhook-Contact',
        'test.webhook@example.com'
    ) RETURNING id INTO v_contact_id;
    
    RAISE NOTICE 'Created Contact ID: %', v_contact_id;

    -- 4. Verify it is in the queue
    -- Give a small delay for the trigger to fire? Triggers are synchronous within the transaction usually, 
    -- but let's check immediately.
    
    SELECT count(*) INTO v_queue_count
    FROM public.webhook_queue 
    WHERE webhook_id = v_webhook_id;

    IF v_queue_count > 0 THEN
        RAISE NOTICE 'SUCCESS: Webhook event queued successfully!';
        -- Optional: Show the payload
        -- RAISE NOTICE 'Payload: %', (SELECT payload FROM public.webhook_queue WHERE webhook_id = v_webhook_id LIMIT 1);
    ELSE
        RAISE NOTICE 'FAILURE: Webhook event was NOT queued.';
    END IF;

    -- 5. Cleanup
    DELETE FROM public.contacts WHERE id = v_contact_id;
    DELETE FROM public.webhooks WHERE id = v_webhook_id;
    -- Queue items should be deleted by cascade if configured, or we leave them.
    -- Checking schema: ON DELETE CASCADE is set for webhook_queue.webhook_id
    
    RAISE NOTICE 'Cleanup complete.';

END $$;
