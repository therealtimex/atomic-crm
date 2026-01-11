-- Add professional payment fields to invoices
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS payment_terms text,
ADD COLUMN IF NOT EXISTS terms_and_conditions text;

-- Update the summary views to include new fields if necessary (usually they select * from invoices or specific columns)
-- Let's check the views first if possible, but usually select * is safe for these enrichment fields.
