-- supabase/migrations/0002_extend_schema_for_crm.sql

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to read properties" ON public.properties;
DROP POLICY IF EXISTS "Allow authenticated users to view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Customers can view their own interests" ON public.property_interests;
DROP POLICY IF EXISTS "Customers can delete their own interests" ON public.property_interests;
DROP POLICY IF EXISTS "Admins can manage all interests" ON public.property_interests;

-- Drop existing RLS enablement to re-apply cleanly
ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_interests DISABLE ROW LEVEL SECURITY;

----------------------------------------------------------------
-- PROFILES TABLE - RLS POLICIES
----------------------------------------------------------------
-- 1. Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Allow users to view all profiles (for names, etc.)
CREATE POLICY "Allow authenticated users to view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 3. Policy: Allow users to update their own profile
CREATE POLICY "Allow users to update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

----------------------------------------------------------------
-- PROPERTIES TABLE - RLS POLICIES
----------------------------------------------------------------
-- 1. Enable RLS for properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Allow any authenticated user to read properties
CREATE POLICY "Allow authenticated users to read properties"
ON public.properties
FOR SELECT
TO authenticated
USING (true);

-- 3. Policy: Allow admins/agents to create/update/delete properties
CREATE POLICY "Allow agents and admins to manage properties"
ON public.properties
FOR ALL
TO authenticated
USING (
  (get_my_claim('user_role'::text)) = '"admin"'::jsonb OR
  (get_my_claim('user_role'::text)) = '"super_admin"'::jsonb OR
  (get_my_claim('user_role'::text)) = '"agent"'::jsonb
);

----------------------------------------------------------------
-- PROPERTY_INTERESTS TABLE - RLS POLICIES
----------------------------------------------------------------
-- 1. Enable RLS for property_interests
ALTER TABLE public.property_interests ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Customers can view their own interests
CREATE POLICY "Customers can view their own interests"
ON public.property_interests
FOR SELECT
TO authenticated
USING (auth.uid() = customer_id);

-- 3. Policy: Customers can create their own interests
CREATE POLICY "Customers can create their own interests"
ON public.property_interests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);

-- 4. Policy: Customers can delete their own interests
CREATE POLICY "Customers can delete their own interests"
ON public.property_interests
FOR DELETE
TO authenticated
USING (auth.uid() = customer_id);

-- 5. Policy: Admins and Super Admins can manage all interests
CREATE POLICY "Admins can manage all interests"
ON public.property_interests
FOR ALL
TO authenticated
USING (
  (get_my_claim('user_role'::text)) = '"admin"'::jsonb OR
  (get_my_claim('user_role'::text)) = '"super_admin"'::jsonb
);


-- Note: The original content of this file is preserved below for reference.
-- It seems there was an intention to add columns which are already present in the new schema.
-- This part can be considered redundant if the initial schema setup was complete.

-- ALTER TABLE public.profiles
-- ADD COLUMN approval_status text DEFAULT 'pending',
-- ADD COLUMN approved_by uuid REFERENCES public.profiles(id),
-- ADD COLUMN approved_at timestamptz;

-- ALTER TABLE public.properties
-- ADD COLUMN property_type text;

-- CREATE TYPE interest_level AS ENUM ('interested', 'very_interested', 'ready_to_buy');
-- CREATE TYPE interest_status AS ENUM ('pending', 'assigned', 'contacted', 'meeting_scheduled', 'completed', 'cancelled');
-- CREATE TABLE property_interests (
--     id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
--     property_id uuid NOT NULL REFERENCES public.properties(id),
--     customer_id uuid NOT NULL REFERENCES public.profiles(id),
--     interest_level interest_level NOT NULL,
--     message text,
--     preferred_meeting_time timestamptz,
--     status interest_status NOT NULL DEFAULT 'pending',
--     created_at timestamptz NOT NULL DEFAULT now(),
--     updated_at timestamptz NOT NULL DEFAULT now()
-- );

-- ... (and so on for other tables)
