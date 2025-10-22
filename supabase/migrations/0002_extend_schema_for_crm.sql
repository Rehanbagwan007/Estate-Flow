-- supabase/migrations/0002_extend_schema_for_crm.sql

-- Drop existing RLS policies on all relevant tables to ensure a clean slate.
DROP POLICY IF EXISTS "Allow authenticated users to view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Allow authenticated users to read properties" ON public.properties;
DROP POLICY IF EXISTS "Allow admin and agents to manage properties" ON public.properties;

DROP POLICY IF EXISTS "Customers can manage their own interests" ON public.property_interests;
DROP POLICY IF EXISTS "Admins and agents can view all interests" ON public.property_interests;


-- === PROFILES TABLE POLICIES ===
-- 1. Enable RLS for the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. NEW: Allow any authenticated user to VIEW any profile.
-- (This is the primary fix for the redirect loop and allows the app to function)
CREATE POLICY "Allow authenticated users to view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- 3. NEW: Allow users to update their OWN profile.
CREATE POLICY "Allow users to update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 4. NEW: Allow admins/super_admins to perform ANY action on profiles.
CREATE POLICY "Allow admins to manage all profiles"
ON public.profiles FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
);


-- === PROPERTIES TABLE POLICIES ===
-- 1. Enable RLS for the properties table
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- 2. NEW: Allow any authenticated user to VIEW properties.
CREATE POLICY "Allow authenticated users to view properties"
ON public.properties FOR SELECT
TO authenticated
USING (true);

-- 3. NEW: Allow admin, super_admin, and agents to MANAGE properties.
CREATE POLICY "Allow admins and agents to manage properties"
ON public.properties FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'agent')
);


-- === PROPERTY_INTERESTS TABLE POLICIES ===
-- 1. Enable RLS for the property_interests table
ALTER TABLE public.property_interests ENABLE ROW LEVEL SECURITY;

-- 2. NEW: Allow customers to perform ANY action on THEIR OWN interests.
-- (This fixes the SELECT and DELETE issue on the 'My Interests' page)
CREATE POLICY "Allow customers to manage their own interests"
ON public.property_interests FOR ALL
TO authenticated
USING (auth.uid() = customer_id);

-- 3. NEW: Allow admins, super_admins, and agents to VIEW all interests.
-- (This is necessary for the admin/agent dashboards)
CREATE POLICY "Allow staff to view all interests"
ON public.property_interests FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'agent')
);
