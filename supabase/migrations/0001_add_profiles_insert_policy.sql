-- supabase/migrations/0001_add_profiles_insert_policy.sql

-- Create a policy to allow admins and super_admins to insert into the profiles table.
-- This is required for the user creation functionality in the admin dashboard.
CREATE POLICY "Admins can create new user profiles."
ON public.profiles FOR INSERT
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
);
