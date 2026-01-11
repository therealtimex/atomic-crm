-- Create invoice_templates table
CREATE TABLE public.invoice_templates (
    id bigserial PRIMARY KEY,
    name text NOT NULL,
    description text,
    default_payment_terms text,
    default_terms_and_conditions text,
    default_due_days integer DEFAULT 30,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create invoice_template_items table
CREATE TABLE public.invoice_template_items (
    id bigserial PRIMARY KEY,
    template_id bigint NOT NULL REFERENCES public.invoice_templates(id) ON DELETE CASCADE,
    description text NOT NULL,
    item_description text,
    quantity numeric DEFAULT 1 NOT NULL,
    unit_price numeric NOT NULL,
    tax_rate numeric DEFAULT 0 NOT NULL,
    discount_amount numeric DEFAULT 0 NOT NULL,
    discount_type text DEFAULT 'percentage' NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create index on template_id for faster lookups
CREATE INDEX invoice_template_items_template_id_idx ON public.invoice_template_items(template_id);

-- Enable RLS
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_template_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoice_templates
CREATE POLICY "Enable read access for authenticated users" 
    ON public.invoice_templates FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Enable insert for authenticated users" 
    ON public.invoice_templates FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" 
    ON public.invoice_templates FOR UPDATE 
    TO authenticated 
    USING (true);

CREATE POLICY "Enable delete for authenticated users" 
    ON public.invoice_templates FOR DELETE 
    TO authenticated 
    USING (true);

-- RLS Policies for invoice_template_items
CREATE POLICY "Enable read access for authenticated users" 
    ON public.invoice_template_items FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Enable insert for authenticated users" 
    ON public.invoice_template_items FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" 
    ON public.invoice_template_items FOR UPDATE 
    TO authenticated 
    USING (true);

CREATE POLICY "Enable delete for authenticated users" 
    ON public.invoice_template_items FOR DELETE 
    TO authenticated 
    USING (true);
