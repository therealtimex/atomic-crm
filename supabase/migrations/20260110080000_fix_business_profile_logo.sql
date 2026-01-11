-- Standardize business_profile logo column to JSONB to match companies/contacts
ALTER TABLE public.business_profile 
RENAME COLUMN logo_url TO logo_old;

ALTER TABLE public.business_profile 
ADD COLUMN logo jsonb;

-- Backfill data if logo_old was already populated (unlikely given it's not working)
UPDATE public.business_profile 
SET logo = jsonb_build_object('src', logo_old)
WHERE logo_old IS NOT NULL AND logo_old != '';

ALTER TABLE public.business_profile 
DROP COLUMN logo_old;
