-- Add discount_type to invoices table
-- It can be 'fixed' (absolute amount) or 'percentage'

-- Create type if it doesn't exist (optional, simple text check constraint is often easier for local dev)
-- Using text with check constraint for maximum flexibility in early phase
ALTER TABLE "public"."invoices"
ADD COLUMN "discount_type" text NOT NULL DEFAULT 'fixed'
CHECK ("discount_type" IN ('fixed', 'percentage'));

-- Update existing records to reflect 'fixed' if any (default already does this)
