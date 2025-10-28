-- supabase/migrations/0002_extend_schema_for_crm.sql

-- Create a table to store salary calculation parameters
CREATE TABLE IF NOT EXISTS public.salary_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parameter_name TEXT NOT NULL UNIQUE,
    rate NUMERIC NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    set_by UUID REFERENCES public.profiles(id)
);

-- Add comments for clarity
COMMENT ON TABLE public.salary_parameters IS 'Stores rates for performance-based salary calculations.';
COMMENT ON COLUMN public.salary_parameters.parameter_name IS 'The name of the parameter (e.g., per_call_rate, per_meeting_rate).';
COMMENT ON COLUMN public.salary_parameters.rate IS 'The monetary value for the parameter.';
COMMENT ON COLUMN public.salary_parameters.set_by IS 'The user ID of the admin who set the parameter.';

-- Enable RLS for the new table
ALTER TABLE public.salary_parameters ENABLE ROW LEVEL SECURITY;

-- Allow admins and team members to read the parameters
CREATE POLICY "Allow read access to authenticated users"
ON public.salary_parameters
FOR SELECT
TO authenticated
USING (true);

-- Allow admins and super_admins to insert new parameters
CREATE POLICY "Allow insert access to admins"
ON public.salary_parameters
FOR INSERT
TO authenticated
WITH CHECK (
  (get_my_claim('user_role'::text)) = '"super_admin"'::jsonb OR
  (get_my_claim('user_role'::text)) = '"admin"'::jsonb
);

-- Allow admins and super_admins to update existing parameters
CREATE POLICY "Allow update access to admins"
ON public.salary_parameters
FOR UPDATE
TO authenticated
USING (
  (get_my_claim('user_role'::text)) = '"super_admin"'::jsonb OR
  (get_my_claim('user_role'::text)) = '"admin"'::jsonb
)
WITH CHECK (
  (get_my_claim('user_role'::text)) = '"super_admin"'::jsonb OR
  (get_my_claim('user_role'::text)) = '"admin"'::jsonb
);


-- Create a function to set the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION public.handle_salary_parameters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function when the row is updated
CREATE TRIGGER on_salary_parameters_updated
BEFORE UPDATE ON public.salary_parameters
FOR EACH ROW
EXECUTE FUNCTION public.handle_salary_parameters_updated_at();

-- Insert default values so the form is not empty on first load
INSERT INTO public.salary_parameters (parameter_name, rate, description, set_by)
VALUES
    ('per_call_rate', 10, 'Amount paid per completed call', (SELECT id FROM profiles WHERE role = 'super_admin' LIMIT 1)),
    ('per_meeting_rate', 50, 'Amount paid per completed meeting/appointment', (SELECT id FROM profiles WHERE role = 'super_admin' LIMIT 1)),
    ('per_km_travel_rate', 5, 'Amount paid per kilometer traveled for site visits', (SELECT id FROM profiles WHERE role = 'super_admin' LIMIT 1))
ON CONFLICT (parameter_name) DO NOTHING;
