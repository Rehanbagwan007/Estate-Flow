-- 1. Create custom types
create type public.user_role as enum ('super_admin', 'admin', 'agent', 'caller_1', 'caller_2', 'sales_manager', 'sales_executive_1', 'sales_executive_2', 'customer');
create type public.property_status as enum ('Available', 'Sold', 'Rented', 'Upcoming');
create type public.property_type as enum ('Residential', 'Commercial', 'Land');
create type public.lead_status as enum ('Hot', 'Warm', 'Cold');
create type public.task_status as enum ('Todo', 'InProgress', 'Done');
create type public.interest_level as enum ('interested', 'very_interested', 'ready_to_buy');
create type public.interest_status as enum ('pending', 'assigned', 'contacted', 'meeting_scheduled', 'completed', 'cancelled');
create type public.appointment_status as enum ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
create type public.call_type as enum ('inbound', 'outbound');
create type public.call_status as enum ('initiated', 'ringing', 'answered', 'completed', 'failed', 'busy', 'no_answer');
create type public.assignment_type as enum ('property_interest', 'follow_up', 'cold_call', 'meeting');
create type public.assignment_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.assignment_status as enum ('assigned', 'accepted', 'in_progress', 'completed', 'cancelled');
create type public.visit_type as enum ('property_visit', 'customer_meeting', 'site_inspection', 'follow_up');
create type public.notification_type as enum ('property_interest', 'appointment_reminder', 'call_reminder', 'approval_status', 'task_assigned', 'meeting_scheduled');
create type public.notification_channel as enum ('app', 'email', 'whatsapp', 'sms');
create type public.integration_type as enum ('exotel', 'whatsapp', 'olx', '99acres', 'facebook', 'instagram');

-- 2. Create profiles table
create table if not exists public.profiles (
  id uuid not null references auth.users on delete cascade,
  first_name text,
  last_name text,
  email text unique,
  phone text unique,
  role public.user_role not null default 'customer',
  approval_status text default 'pending', -- pending, approved, rejected
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
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
create policy "Customers can manage their own interests." on public.property_interests for all using (auth.uid() = customer_id);
create policy "Admins and assigned agents can view interests." on public.property_interests for select using (
  (select role from public.profiles where id = auth.uid()) in ('admin', 'super_admin') or
  exists (select 1 from agent_assignments where agent_assignments.property_interest_id = public.property_interests.id and agent_assignments.agent_id = auth.uid())
);
create policy "Admins can update interests." on public.property_interests for update using (
  (select role from public.profiles where id = auth.uid()) in ('admin', 'super_admin')
);

-- 6. Create leads table
create table if not exists public.leads (
  id uuid not null default gen_random_uuid(),
  first_name text not null,
  last_name text,
  email text,
  phone text,
  status public.lead_status not null default 'Warm',
  assigned_to uuid references public.profiles(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id)
);
alter table public.leads enable row level security;
create policy "Leads can be managed by admins and assigned agents." on public.leads for all using (
  (select role from public.profiles where id = auth.uid()) in ('admin', 'super_admin') or
  assigned_to = auth.uid()
);

-- 7. Create tasks table
create table if not exists public.tasks (
  id uuid not null default gen_random_uuid(),
  title text not null,
  description text,
  status public.task_status not null default 'Todo',
  due_date timestamptz,
  assigned_to uuid references public.profiles(id),
  created_by uuid references auth.users(id),
  related_lead_id uuid references public.leads(id),
  related_property_id uuid references public.properties(id),
  created_at timestamptz not null default now(),
  primary key (id)
);
alter table public.tasks enable row level security;
create policy "Tasks can be managed by admins and assigned users." on public.tasks for all using (
  (select role from public.profiles where id = auth.uid()) in ('admin', 'super_admin') or
  assigned_to = auth.uid() or
  created_by = auth.uid()
);

-- 8. Create appointments table
create table if not exists public.appointments (
  id uuid not null default gen_random_uuid(),
  property_interest_id uuid not null references public.property_interests(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  agent_id uuid not null references public.profiles(id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_minutes integer,
  location text,
  notes text,
  status public.appointment_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id)
);
alter table public.appointments enable row level security;
create policy "Users can manage their own appointments." on public.appointments for all using (
  auth.uid() = customer_id or auth.uid() = agent_id or
  (select role from public.profiles where id = auth.uid()) in ('admin', 'super_admin')
);

-- 9. Create call_logs table
create table if not exists public.call_logs (
  id uuid not null default gen_random_uuid(),
  call_id text not null, -- From Exotel or other provider
  agent_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid references public.profiles(id) on delete cascade,
  property_id uuid references public.properties(id),
  call_type public.call_type not null default 'outbound',
  call_status public.call_status not null default 'initiated',
  duration_seconds integer,
  recording_url text,
  recording_duration_seconds integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id)
);
alter table public.call_logs enable row level security;
create policy "Users can see their own call logs." on public.call_logs for select using (
  auth.uid() = agent_id or auth.uid() = customer_id
);
create policy "Admins can see all call logs." on public.call_logs for select using (
  (select role from public.profiles where id = auth.uid()) in ('admin', 'super_admin')
);
create policy "Agents can create call logs." on public.call_logs for insert with check (
  auth.uid() = agent_id
);

-- 10. Create agent_assignments table
create table if not exists public.agent_assignments (
  id uuid not null default gen_random_uuid(),
  property_interest_id uuid references public.property_interests(id),
  agent_id uuid not null references public.profiles(id),
  customer_id uuid not null references public.profiles(id),
  assigned_by uuid not null references public.profiles(id),
  assignment_type public.assignment_type not null default 'property_interest',
  priority public.assignment_priority not null default 'medium',
  status public.assignment_status not null default 'assigned',
  notes text,
  due_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id)
);
alter table public.agent_assignments enable row level security;
create policy "Admins can manage assignments." on public.agent_assignments for all using (
  (select role from public.profiles where id = auth.uid()) in ('admin', 'super_admin')
);
create policy "Assigned agents can view their assignments." on public.agent_assignments for select using (
  auth.uid() = agent_id
);

-- 11. Create field_visits table
create table if not exists public.field_visits (
  id uuid not null default gen_random_uuid(),
  agent_id uuid not null references public.profiles(id),
  property_id uuid references public.properties(id),
  visit_date timestamptz not null,
  visit_type public.visit_type not null default 'property_visit',
  latitude numeric,
  longitude numeric,
  address text,
  duration_minutes integer,
  notes text,
  photos text[],
  created_at timestamptz not null default now(),
  primary key (id)
);
alter table public.field_visits enable row level security;
create policy "Agents can manage their own field visits." on public.field_visits for all using (
  auth.uid() = agent_id
);
create policy "Admins can view all field visits." on public.field_visits for select using (
  (select role from public.profiles where id = auth.uid()) in ('admin', 'super_admin')
);

-- 12. Create notifications table
create table if not exists public.notifications (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  type public.notification_type not null,
  title text not null,
  message text not null,
  is_read boolean default false,
  data jsonb,
  sent_at timestamptz,
  sent_via public.notification_channel not null default 'app',
  created_at timestamptz not null default now(),
  primary key (id)
);
alter table public.notifications enable row level security;
create policy "Users can manage their own notifications." on public.notifications for all using (auth.uid() = user_id);

-- 13. Create integration_settings table
create table if not exists public.integration_settings (
  id uuid not null default gen_random_uuid(),
  integration_type public.integration_type not null,
  settings jsonb not null,
  is_active boolean default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id)
);
alter table public.integration_settings enable row level security;
create policy "Admins can manage integrations." on public.integration_settings for all using (
  (select role from public.profiles where id = auth.uid()) in ('admin', 'super_admin')
);

-- 14. Create property_shares table
create table if not exists public.property_shares (
  id uuid not null default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  platform public.integration_type not null,
  post_url text not null,
  created_at timestamptz not null default now(),
  primary key (id)
);
alter table public.property_shares enable row level security;
create policy "Shares are viewable by admins." on public.property_shares for select using (
  (select role from public.profiles where id = auth.uid()) in ('admin', 'super_admin')
);

-- Trigger function to create profile on new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, email, role, phone)
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.email,
    (new.raw_user_meta_data->>'role')::public.user_role,
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger to delete profile when auth user is deleted
create or replace function public.delete_user_profile()
returns trigger as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute procedure public.delete_user_profile();
  
-- Enable RLS for all tables
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.tasks enable row level security;
alter table public.property_media enable row level security;
alter table public.property_interests enable row level security;
alter table public.appointments enable row level security;
alter table public.call_logs enable row level security;
alter table public.agent_assignments enable row level security;
alter table public.field_visits enable row level security;
alter table public.notifications enable row level security;
alter table public.integration_settings enable row level security;
alter table public.property_shares enable row level security;
