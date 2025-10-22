-- Update user_role enum to include all roles
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'caller_1';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'caller_2';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'sales_manager';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'sales_executive_1';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'sales_executive_2';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'customer';

-- Update the handle_new_user function to use the selected role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'agent')::user_role -- Use selected role or default to agent
  );
  RETURN NEW;
END;
$$;
