-- Add Resend API key to business_profile for UI-based configuration
ALTER TABLE public.business_profile 
ADD COLUMN IF NOT EXISTS resend_api_key text;

COMMENT ON COLUMN public.business_profile.resend_api_key IS 'Resend API key for transactional email sending. If set, this takes precedence over environment variables.';
