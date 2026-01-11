-- Add explicit unique constraint to invoice_number
-- (This reinforces the existing unique index with a formal constraint)

ALTER TABLE "public"."invoices"
ADD CONSTRAINT "invoices_invoice_number_key" UNIQUE ("invoice_number");
