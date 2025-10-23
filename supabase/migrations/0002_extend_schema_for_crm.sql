-- supabase/migrations/0002_extend_schema_for_crm.sql

<<<<<<< HEAD
-- 2. Create profiles table
create table if not exists public.profiles (
  id uuid not null references auth.users on delete cascade,
  first_name text,
  last_name text,
  email text unique,
  phone text unique,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id)
);
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile." on profiles for update using (auth.uid() = id);
create policy "Admins can update any profile" on profiles for update to authenticated with check (
  (select role from public.profiles where id = auth.uid()) in ('admin', 'super_admin')
);

-- 3. Create properties table
create table if not exists public.properties (
  id uuid not null default gen_random_uuid(),
  title text not null,
  description text,
  address text not null,
  city text not null,
  state text not null,
  zip_code text not null,
  price numeric not null,
  bedrooms numeric,
  bathrooms numeric,
  area_sqft numeric,
  property_type public.property_type not null default 'Residential',
  status public.property_status not null default 'Available',
  owner_name text,
  owner_contact text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id)
);
alter table public.properties enable row level security;
create policy "Properties are viewable by authenticated users." on public.properties for select to authenticated using (true);
create policy "Agents and admins can create properties." on public.properties for insert with check (
  (select role from public.profiles where id = auth.uid()) in ('agent', 'admin', 'super_admin')
);
create policy "Property creator or admins can update." on public.properties for update using (
  auth.uid() = created_by or 
  (select role from public.profiles where id = auth.uid()) in ('admin', 'super_admin')
);
create policy "Property creator or admins can delete." on public.properties for delete using (
  auth.uid() = created_by or 
  (select role from public.profiles where id = auth.uid()) in ('admin', 'super_admin')
);

-- 4. Create property_media table
create table if not exists public.property_media (
  id uuid not null default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade,
  file_path text not null,
  file_type text,
  created_at timestamptz not null default now(),
  primary key (id)
);
alter table public.property_media enable row level security;
create policy "Property media is viewable by authenticated users." on public.property_media for select to authenticated using (true);
create policy "Agents and admins can insert media." on public.property_media for insert with check (
  (select role from public.profiles where id = auth.uid()) in ('agent', 'admin', 'super_admin')
);
create policy "Media creator or admins can update." on public.property_media for update using (
  exists (select 1 from properties where properties.id = property_id and properties.created_by = auth.uid()) or
  (select role from public.profiles where id = auth.uid()) in ('admin', 'super_admin')
);
create policy "Media creator or admins can delete." on public.property_media for delete using (
  exists (select 1 from properties where properties.id = property_id and properties.created_by = auth.uid()) or
  (select role from public.profiles where id = auth.uid()) in ('admin', 'super_admin')
);

-- 5. Create property_interests table
create table if not exists public.property_interests (
  id uuid not null default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  interest_level public.interest_level not null default 'interested',
  status public.interest_status not null default 'pending',
  message text,
  preferred_meeting_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id)
);
alter table public.property_interests enable row level security;
create policy "Users can manage their own interests." on public.property_interests for all using (auth.uid() = customer_id);
create policy "Admins and assigned agents can view interests." on public.property_interests for select using (
  (select role from public.profiles where id = auth.uid()) in ('admin', 'super_admin') or
  exists (select 1 from agent_assignments where agent_assignments.property_interest_id = public.property_interests.id and agent_assignments.agent_id = auth.uid())
);
create policy "Admins can update interests." on public.property_interests for update using (
  (select role from public.profiles where id = auth.uid()) in ('admin', 'super_admin')
);
=======
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
>>>>>>> 2a2cb5be7b204e2fcf4530a65a8b7c337ab406e7

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
