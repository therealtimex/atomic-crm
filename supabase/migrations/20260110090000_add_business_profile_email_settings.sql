-- Add email settings to business_profile
ALTER TABLE public.business_profile 
ADD COLUMN IF NOT EXISTS email_from_name text,
ADD COLUMN IF NOT EXISTS email_from_email text;

-- Update record with ID 1 with defaults if it exists (Optional - the user can set these in UI)
-- UPDATE public.business_profile 
-- SET email_from_name = name, 
--     email_from_email = 'invoices@yourdomain.com'
-- WHERE id = 1 AND email_from_email IS NULL;
