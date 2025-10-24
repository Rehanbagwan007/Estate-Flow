
-- 1. Enable RLS on the tables if it's not already enabled
ALTER TABLE public.agent_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_interests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, to prevent conflicts
DROP POLICY IF EXISTS "Admins can create agent assignments" ON public.agent_assignments;
DROP POLICY IF EXISTS "Admins can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can update property interests" ON public.property_interests;
DROP POLICY IF EXISTS "Users can view their own data" ON public.agent_assignments;
DROP POLICY IF EXISTS "Users can view their own data" ON public.tasks;


-- 2. Policy to allow admins to insert into agent_assignments
CREATE POLICY "Admins can create agent assignments"
ON public.agent_assignments
FOR INSERT
TO authenticated
WITH CHECK (
    (get_my_claim('role'::text)) = '"super_admin"'::jsonb OR
    (get_my_claim('role'::text)) = '"admin"'::jsonb
);

-- 3. Policy to allow admins to insert into tasks
CREATE POLICY "Admins can create tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
    (get_my_claim('role'::text)) = '"super_admin"'::jsonb OR
    (get_my_claim('role'::text)) = '"admin"'::jsonb
);

-- 4. Policy to allow admins to update property_interests
CREATE POLICY "Admins can update property interests"
ON public.property_interests
FOR UPDATE
TO authenticated
USING (
    (get_my_claim('role'::text)) = '"super_admin"'::jsonb OR
    (get_my_claim('role'::text)) = '"admin"'::jsonb
)
WITH CHECK (
    (get_my_claim('role'::text)) = '"super_admin"'::jsonb OR
    (get_my_claim('role'::text)) = '"admin"'::jsonb
);

-- 5. Allow users to see assignments and tasks assigned to them
CREATE POLICY "Users can view their own data"
ON public.agent_assignments
FOR SELECT
TO authenticated
USING (auth.uid() = agent_id);

CREATE POLICY "Users can view their own data"
ON public.tasks
FOR SELECT
TO authenticated
USING (auth.uid() = assigned_to);
