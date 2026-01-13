-- Add onboarding_completed flag to business_profile
ALTER TABLE public.business_profile 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Add a comment for clarity
COMMENT ON COLUMN public.business_profile.onboarding_completed IS 'Flag to indicate if the organization has completed the initial onboarding wizard';
