-- supabase/migrations/0002_extend_schema_for_crm.sql

-- Enable RLS for all relevant tables if not already enabled.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure a clean slate.
DROP POLICY IF EXISTS "Allow authenticated users to read properties" ON public.properties;
DROP POLICY IF EXISTS "Allow admin and agents to manage properties" ON public.properties;
DROP POLICY IF EXISTS "Allow authenticated users to view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Customers can manage their own interests" ON public.property_interests;
DROP POLICY IF EXISTS "Admins and agents can view all interests" ON public.property_interests;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;


-- =================================================================
-- RLS POLICIES
-- =================================================================

-- -----------------------------------------------------------------
-- Table: profiles
-- -----------------------------------------------------------------

-- 1. Read Access: Logged-in users can view basic details of other profiles.
CREATE POLICY "Allow authenticated users to view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- 2. Read Own Profile: A user can always read their own complete profile. (FIX FOR REDIRECT LOOP)
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 3. Update Access: Users can update their own profile.
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- 4. Full Admin Access: Admins/Super Admins have full control.
CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'));


-- -----------------------------------------------------------------
-- Table: properties
-- -----------------------------------------------------------------

-- 1. Read Access: Any logged-in user can view property listings.
CREATE POLICY "Allow authenticated users to read properties"
ON public.properties FOR SELECT
TO authenticated
USING (true);

-- 2. Write Access: Admins and agents can create, update, and delete properties.
CREATE POLICY "Allow admin and agents to manage properties"
ON public.properties FOR ALL
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'agent'))
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'agent'));

-- -----------------------------------------------------------------
-- Table: property_interests
-- -----------------------------------------------------------------

-- 1. Customer Access: Customers can create, view, and delete their own interests.
CREATE POLICY "Customers can manage their own interests"
ON public.property_interests FOR ALL
TO authenticated
USING (auth.uid() = customer_id);

-- 2. Admin/Agent Read Access: Admins and agents can see all interests to manage them.
CREATE POLICY "Admins and agents can view all interests"
ON public.property_interests FOR SELECT
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'agent'));


-- -----------------------------------------------------------------
-- Table: agent_assignments
-- -----------------------------------------------------------------

-- 1. Agent Access: Agents can view assignments they are assigned to.
CREATE POLICY "Agents can view their own assignments"
ON public.agent_assignments FOR SELECT
TO authenticated
USING (agent_id = auth.uid());

-- 2. Admin Access: Admins have full control over all assignments.
CREATE POLICY "Admins can manage all assignments"
ON public.agent_assignments FOR ALL
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'));

-- -----------------------------------------------------------------
-- Table: tasks
-- -----------------------------------------------------------------

-- 1. Agent Access: Agents can view tasks assigned to them.
CREATE POLICY "Agents can see tasks assigned to them"
ON public.tasks FOR SELECT
TO authenticated
USING (assigned_to = auth.uid());

-- 2. Admin Access: Admins have full control over all tasks.
CREATE POLICY "Admins can manage all tasks"
ON public.tasks FOR ALL
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'));


-- =================================================================
-- Automatically create profile on new user signup
-- =================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, phone, role, approval_status)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone',
    (NEW.raw_user_meta_data ->> 'role')::public.user_role,
    'pending' -- Set default approval status
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =================================================================
-- Automatically delete profile when user is deleted
-- =================================================================
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_delete();
