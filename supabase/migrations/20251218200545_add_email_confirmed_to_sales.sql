-- Add email_confirmed_at column to sales table
ALTER TABLE sales ADD COLUMN email_confirmed_at timestamp with time zone;

-- Update existing records with current confirmation status
UPDATE sales
SET email_confirmed_at = auth.users.email_confirmed_at
FROM auth.users
WHERE sales.user_id = auth.users.id;

-- Update the handle_new_user trigger to include email_confirmed_at
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  sales_count integer;
BEGIN
  -- Count existing sales records
  SELECT COUNT(*) INTO sales_count FROM public.sales;

  INSERT INTO public.sales (user_id, email, first_name, last_name, administrator, email_confirmed_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    -- First user is administrator, others are not
    CASE WHEN sales_count = 0 THEN true ELSE false END,
    new.email_confirmed_at
  );
  RETURN new;
END;
$$;

-- Update the handle_update_user trigger to include email_confirmed_at
CREATE OR REPLACE FUNCTION handle_update_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.sales
  SET
    email = new.email,
    first_name = COALESCE(new.raw_user_meta_data->>'first_name', first_name),
    last_name = COALESCE(new.raw_user_meta_data->>'last_name', last_name),
    email_confirmed_at = new.email_confirmed_at
  WHERE user_id = new.id;
  RETURN new;
END;
$$;
