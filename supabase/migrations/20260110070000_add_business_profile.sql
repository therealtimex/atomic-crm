-- Create business_profile table
CREATE TABLE IF NOT EXISTS public.business_profile (
    id integer PRIMARY KEY DEFAULT 1,
    name text NOT NULL DEFAULT 'My Company',
    address text,
    tax_id text,
    vat_number text,
    bank_details text,
    logo_url text,
    default_payment_terms text,
    default_terms_and_conditions text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    -- Ensure only one record exists
    CONSTRAINT single_row CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE public.business_profile ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read access to all authenticated users"
    ON public.business_profile FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow update access to all authenticated users"
    ON public.business_profile FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Initial record
INSERT INTO public.business_profile (id, name)
VALUES (1, 'My Company')
ON CONFLICT (id) DO NOTHING;

-- Grant access
GRANT ALL ON public.business_profile TO authenticated;
GRANT ALL ON public.business_profile TO service_role;
