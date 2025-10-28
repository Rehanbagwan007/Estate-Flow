
-- Insert default value for the new follow-up rate parameter
INSERT INTO public.salary_parameters (parameter_name, rate, description, set_by)
VALUES
    ('per_follow_up_rate', 5, 'Amount paid per completed follow-up task', (SELECT id FROM profiles WHERE role = 'super_admin' LIMIT 1))
ON CONFLICT (parameter_name) DO NOTHING;
