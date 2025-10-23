-- Create custom ENUM types required for the new tables
CREATE TYPE public.assignment_type AS ENUM ('property_interest', 'follow_up', 'cold_call', 'meeting');
CREATE TYPE public.assignment_status AS ENUM ('assigned', 'accepted', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.assignment_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.task_status AS ENUM ('Todo', 'InProgress', 'Done');
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.call_type AS ENUM ('inbound', 'outbound');
CREATE TYPE public.call_status AS ENUM ('initiated', 'ringing', 'answered', 'completed', 'failed', 'busy', 'no_answer');
CREATE TYPE public.visit_type AS ENUM ('property_visit', 'customer_meeting', 'site_inspection', 'follow_up');
CREATE TYPE public.notification_type AS ENUM ('property_interest', 'appointment_reminder', 'call_reminder', 'approval_status', 'task_assigned', 'meeting_scheduled');
CREATE TYPE public.notification_channel AS ENUM ('app', 'email', 'whatsapp', 'sms');
CREATE TYPE public.integration_type AS ENUM ('exotel', 'whatsapp', 'olx', '99acres', 'facebook', 'instagram');


-- Create the agent_assignments table
CREATE TABLE IF NOT EXISTS public.agent_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_interest_id UUID REFERENCES public.property_interests(id) ON DELETE SET NULL,
    agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assignment_type public.assignment_type NOT NULL DEFAULT 'property_interest',
    status public.assignment_status NOT NULL DEFAULT 'assigned',
    priority public.assignment_priority NOT NULL DEFAULT 'medium',
    notes TEXT,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create the tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status public.task_status NOT NULL DEFAULT 'Todo',
    due_date TIMESTAMPTZ,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    related_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    related_property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create other missing tables
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_interest_id UUID NOT NULL REFERENCES public.property_interests(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INT,
    location TEXT,
    notes TEXT,
    status public.appointment_status NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id TEXT NOT NULL UNIQUE,
    agent_id UUID NOT NULL REFERENCES public.profiles(id),
    customer_id UUID NOT NULL REFERENCES public.profiles(id),
    property_id UUID REFERENCES public.properties(id),
    call_type public.call_type NOT NULL,
    call_status public.call_status NOT NULL,
    duration_seconds INT,
    recording_url TEXT,
    recording_duration_seconds INT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.field_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.profiles(id),
    property_id UUID REFERENCES public.properties(id),
    visit_date DATE NOT NULL,
    visit_type public.visit_type NOT NULL,
    latitude REAL,
    longitude REAL,
    address TEXT,
    duration_minutes INT,
    notes TEXT,
    photos TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type public.notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB,
    sent_via public.notification_channel NOT NULL DEFAULT 'app',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integration_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_type public.integration_type NOT NULL UNIQUE,
    settings JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.property_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    post_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Modify profiles table to use the new user_role enum
ALTER TABLE public.profiles
  ALTER COLUMN role TYPE public.user_role
  USING role::text::public.user_role;

-- Modify properties table to use new enums
ALTER TABLE public.properties
  ALTER COLUMN status TYPE public.property_status
  USING status::text::public.property_status,
  ALTER COLUMN property_type TYPE public.property_type
  USING property_type::text::public.property_type;

-- Modify leads table
ALTER TABLE public.leads
  ALTER COLUMN status TYPE public.lead_status
  USING status::text::public.lead_status;

-- Modify property_interests table
ALTER TABLE public.property_interests
  ALTER COLUMN interest_level TYPE public.interest_level
  USING interest_level::text::public.interest_level,
  ALTER COLUMN status TYPE public.interest_status
  USING status::text::public.interest_status;


-- Create or replace the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, email, role, approval_status)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'first_name',
        new.raw_user_meta_data->>'last_name',
        new.email,
        (new.raw_user_meta_data->>'role')::public.user_role,
        'pending'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists, then create it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
