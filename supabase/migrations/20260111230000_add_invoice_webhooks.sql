-- Add Webhook support for Invoices

CREATE OR REPLACE FUNCTION trigger_invoice_webhooks()
RETURNS TRIGGER AS $$
DECLARE
  specific_event_fired boolean := false;
BEGIN
  -- Invoice created
  IF TG_OP = 'INSERT' THEN
    PERFORM enqueue_webhook_event('invoice.created', to_jsonb(NEW));
    RETURN NEW;
  END IF;

  -- Invoice updated
  IF TG_OP = 'UPDATE' THEN
    -- Status changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM enqueue_webhook_event('invoice.status_changed', jsonb_build_object(
        'invoice', to_jsonb(NEW),
        'old_status', OLD.status,
        'new_status', NEW.status
      ));
      specific_event_fired := true;
    END IF;

    -- Invoice sent (sent_at transitioned from NULL)
    IF OLD.sent_at IS NULL AND NEW.sent_at IS NOT NULL THEN
      PERFORM enqueue_webhook_event('invoice.sent', to_jsonb(NEW));
      specific_event_fired := true;
    END IF;

    -- Generic invoice.updated (only fires if no specific event matched)
    IF NOT specific_event_fired THEN
      PERFORM enqueue_webhook_event('invoice.updated', jsonb_build_object(
        'old', to_jsonb(OLD),
        'new', to_jsonb(NEW)
      ));
    END IF;
  END IF;

  -- Invoice deleted
  IF TG_OP = 'DELETE' THEN
    PERFORM enqueue_webhook_event('invoice.deleted', to_jsonb(OLD));
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for invoices
DROP TRIGGER IF EXISTS invoices_webhook_trigger ON public.invoices;
CREATE TRIGGER invoices_webhook_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION trigger_invoice_webhooks();
