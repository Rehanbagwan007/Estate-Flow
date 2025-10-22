--
-- Extend Existing Tables with CRM-specific columns
--

-- Add approval status to profiles
alter table public.profiles
add column approval_status text default 'pending',
add column approved_by uuid references public.profiles(id),
add column approved_at timestamptz;

-- Add property type to properties (if not already there)
alter table public.properties
add column if not exists property_type text not null default 'Residential';


--
-- Create New CRM-specific Tables
--

-- Table for Property Interests
create table if not exists public.property_interests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  interest_level public.interest_level not null default 'interested',
  message text,
  preferred_meeting_time timestamptz,
  status public.interest_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table for Appointments
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  property_interest_id uuid not null references public.property_interests(id) on delete cascade,
  agent_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_minutes integer,
  location text,
  notes text,
  status public.appointment_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table for Call Logs
create table if not exists public.call_logs (
  id uuid primary key default gen_random_uuid(),
  call_id text not null unique, -- From Exotel or other provider
  agent_id uuid not null references public.profiles(id),
  customer_id uuid references public.profiles(id),
  property_id uuid references public.properties(id),
  call_type public.call_type not null default 'outbound',
  call_status public.call_status not null default 'initiated',
  duration_seconds integer,
  recording_url text,
  recording_duration_seconds integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table for Agent Assignments
create table if not exists public.agent_assignments (
  id uuid primary key default gen_random_uuid(),
  property_interest_id uuid references public.property_interests(id) on delete set null,
  agent_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id),
  assignment_type public.assignment_type not null default 'property_interest',
  priority public.assignment_priority not null default 'medium',
  status public.assignment_status not null default 'assigned',
  notes text,
  due_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table for Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  message text not null,
  data jsonb,
  is_read boolean default false,
  sent_via public.notification_channel not null default 'app',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- Table for Field Visits (GPS Tracking)
create table if not exists public.field_visits (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid references public.properties(id),
  visit_date timestamptz not null,
  visit_type public.visit_type not null,
  latitude double precision,
  longitude double precision,
  address text,
  notes text,
  duration_minutes integer,
  photos text[],
  created_at timestamptz not null default now()
);

-- Table for Social Media Shares
create table if not exists public.property_shares (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  platform text not null,
  post_url text not null,
  shared_at timestamptz not null default now()
);

--
-- Setup Row Level Security (RLS)
--

-- Enable RLS for all relevant tables
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_interests enable row level security;
alter table public.appointments enable row level security;
alter table public.call_logs enable row level security;
alter table public.agent_assignments enable row level security;
alter table public.notifications enable row level security;
alter table public.field_visits enable row level security;
alter table public.property_shares enable row level security;

--
-- RLS Policies
--

-- Profiles Table
create policy "Users can view their own profile." on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile." on public.profiles for update using (auth.uid() = id);
create policy "Allow authenticated users to read profiles" on public.profiles for select to authenticated using (true);

-- Properties Table
create policy "Allow authenticated users to read properties" on public.properties for select to authenticated using (true);
create policy "Admins and property creators can manage properties" on public.properties for all using (
  (select role from public.profiles where id = auth.uid()) in ('admin', 'super_admin') or
  (auth.uid() = created_by)
);

-- Property Interests Table
create policy "Customers can manage their own interests." on public.property_interests for all using (auth.uid() = customer_id);
create policy "Admins and assigned agents can view interests." on public.property_interests for select using (
  (select role from public.profiles where id = auth.uid()) in ('admin', 'super_admin') or
  id in (select property_interest_id from public.agent_assignments where agent_id = auth.uid())
);

-- Appointments Table
create policy "Users can view their own appointments." on public.appointments for select using (auth.uid() = customer_id or auth.uid() = agent_id);
create policy "Users can manage their own appointments." on public.appointments for all using (auth.uid() = customer_id or auth.uid() = agent_id);
create policy "Admins can manage all appointments." on public.appointments for all using ((select role from public.profiles where id = auth.uid()) in ('admin', 'super_admin'));

-- Call Logs Table
create policy "Users can view their own call logs." on public.call_logs for select using (auth.uid() = agent_id or auth.uid() = customer_id);
create policy "Admins and managers can view all call logs." on public.call_logs for select using ((select role from public.profiles where id = auth.uid()) in ('admin', 'super_admin', 'sales_manager'));

-- Agent Assignments Table
create policy "Assigned agents can view their assignments." on public.agent_assignments for select using (auth.uid() = agent_id);
create policy "Admins can manage all assignments." on public.agent_assignments for all using ((select role from public.profiles where id = auth.uid()) in ('admin', 'super_admin'));

-- Notifications Table
create policy "Users can view their own notifications." on public.notifications for all using (auth.uid() = user_id);
