-- Add extended description to invoice items and global discount to invoices

-- Add item_description to invoice_items
ALTER TABLE "public"."invoice_items" 
ADD COLUMN "item_description" text;

-- Add discount to invoices
ALTER TABLE "public"."invoices"
ADD COLUMN "discount" numeric(15,2) NOT NULL DEFAULT 0;

-- Update RLS policies (if new columns need specific handling, but usually wildcard select covers it if * used in policy definition?
-- Our policies are "using (true)", so they cover new columns automatically for select/insert/update.
