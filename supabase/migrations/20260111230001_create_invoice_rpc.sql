-- RPC for atomic invoice creation with items

CREATE OR REPLACE FUNCTION create_invoice_with_items(
    p_invoice_data jsonb
) RETURNS bigint AS $$
DECLARE
    v_invoice_id bigint;
    v_items jsonb;
    v_item jsonb;
BEGIN
    -- Extract items and basic data
    v_items := p_invoice_data->'items';
    
    -- Insert invoice
    INSERT INTO public.invoices (
        invoice_number,
        reference,
        company_id,
        contact_id,
        deal_id,
        sales_id,
        status,
        issue_date,
        due_date,
        currency,
        subtotal,
        tax_total,
        total,
        amount_paid,
        notes,
        payment_terms,
        terms_and_conditions
    )
    VALUES (
        (p_invoice_data->>'invoice_number'),
        (p_invoice_data->>'reference'),
        (p_invoice_data->>'company_id')::bigint,
        (p_invoice_data->>'contact_id')::bigint,
        (p_invoice_data->>'deal_id')::bigint,
        (p_invoice_data->>'sales_id')::bigint,
        COALESCE(p_invoice_data->>'status', 'draft'),
        COALESCE((p_invoice_data->>'issue_date')::timestamp with time zone, now()),
        (p_invoice_data->>'due_date')::timestamp with time zone,
        COALESCE(p_invoice_data->>'currency', 'USD'),
        COALESCE((p_invoice_data->>'subtotal')::numeric, 0),
        COALESCE((p_invoice_data->>'tax_total')::numeric, 0),
        COALESCE((p_invoice_data->>'total')::numeric, 0),
        COALESCE((p_invoice_data->>'amount_paid')::numeric, 0),
        (p_invoice_data->>'notes'),
        (p_invoice_data->>'payment_terms'),
        (p_invoice_data->>'terms_and_conditions')
    )
    RETURNING id INTO v_invoice_id;

    -- Insert items if any
    IF v_items IS NOT NULL AND jsonb_array_length(v_items) > 0 THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
        LOOP
            INSERT INTO public.invoice_items (
                invoice_id,
                description,
                quantity,
                unit_price,
                tax_rate,
                tax_name,
                tax_amount,
                item_type,
                line_total,
                line_total_with_tax,
                sort_order
            )
            VALUES (
                v_invoice_id,
                (v_item->>'description'),
                COALESCE((v_item->>'quantity')::numeric, 1),
                COALESCE((v_item->>'unit_price')::numeric, 0),
                COALESCE((v_item->>'tax_rate')::numeric, 0),
                (v_item->>'tax_name'),
                COALESCE((v_item->>'tax_amount')::numeric, 0),
                COALESCE(v_item->>'item_type', 'service'),
                COALESCE((v_item->>'line_total')::numeric, 0),
                COALESCE((v_item->>'line_total_with_tax')::numeric, 0),
                COALESCE((v_item->>'sort_order')::smallint, 0)
            );
        END LOOP;
    END IF;

    RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
