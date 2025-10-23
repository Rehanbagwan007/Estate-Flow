-- Custom ENUM types for CRM features

-- Assignment related ENUMs
CREATE TYPE public.assignment_type AS ENUM ('property_interest', 'follow_up', 'cold_call', 'meeting');
CREATE TYPE public.assignment_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.assignment_status AS ENUM ('assigned', 'accepted', 'in_progress', 'completed', 'cancelled');

-- Interest related ENUMs
CREATE TYPE public.interest_level AS EN_US ('interested', 'very_interested', 'ready_to_buy');
CREATE TYPE public.interest_status AS ENUM ('pending', 'assigned', 'contacted', 'meeting_scheduled', 'completed', 'cancelled');

-- Appointment related ENUMs
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');

-- Call related ENUMs
CREATE TYPE public.call_status AS ENUM ('initiated', 'ringing', 'answered', 'completed', 'failed', 'busy', 'no_answer');
CREATE TYPE public.call_type AS ENUM ('inbound', 'outbound');

-- Visit related ENUMs
CREATE TYPE public.visit_type AS ENUM ('property_visit', 'customer_meeting', 'site_inspection', 'follow_up');

-- Notification related ENUMs
CREATE TYPE public.notification_type AS ENUM ('property_interest', 'appointment_reminder', 'call_reminder', 'approval_status', 'task_assigned', 'meeting_scheduled');
CREATE TYPE public.notification_channel AS ENUM ('app', 'email', 'whatsapp', 'sms');

-- Integration related ENUMs
CREATE TYPE public.integration_type AS ENUM ('exotel', 'whatsapp', 'olx', '99acres', 'facebook', 'instagram');

-- Property related ENUMs
CREATE TYPE public.property_type AS ENUM ('Residential', 'Commercial', 'Land');


-- Extend profiles table for approval workflow
ALTER TABLE public.profiles
ADD COLUMN approval_status TEXT DEFAULT 'pending',
ADD COLUMN approved_by UUID REFERENCES public.profiles(id),
ADD COLUMN approved_at TIMESTAMPTZ;

-- Extend properties table with property_type
ALTER TABLE public.properties
ADD COLUMN property_type public.property_type;

-- Create property_interests table
CREATE TABLE public.property_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    interest_level public.interest_level NOT NULL DEFAULT 'interested',
    status public.interest_status NOT NULL DEFAULT 'pending',
    preferred_meeting_time TIMESTAMPTZ,
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.property_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own interests" ON public.property_interests FOR ALL USING (auth.uid() = customer_id);
CREATE POLICY "Admins can manage all interests" ON public.property_interests FOR ALL USING (get_my_claim('user_role') = '"admin"' OR get_my_claim('user_role') = '"super_admin"');


-- Create agent_assignments table
CREATE TABLE public.agent_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_interest_id UUID REFERENCES public.property_interests(id) ON DELETE SET NULL,
    agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assignment_type public.assignment_type NOT NULL DEFAULT 'property_interest',
    priority public.assignment_priority NOT NULL DEFAULT 'medium',
    status public.assignment_status NOT NULL DEFAULT 'assigned',
    notes TEXT,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents can see their assignments" ON public.agent_assignments FOR SELECT USING (auth.uid() = agent_id);
CREATE POLICY "Admins can manage all assignments" ON public.agent_assignments FOR ALL USING (get_my_claim('user_role') = '"admin"' OR get_my_claim('user_role') = '"super_admin"');


-- Create appointments table
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_interest_id UUID NOT NULL REFERENCES public.property_interests(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INT,
    location TEXT,
    notes TEXT,
    status public.appointment_status NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own appointments" ON public.appointments FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = agent_id);
CREATE POLICY "Admins can manage all appointments" ON public.appointments FOR ALL USING (get_my_claim('user_role') = '"admin"' OR get_my_claim('user_role') = '"super_admin"');


-- Create call_logs table
CREATE TABLE public.call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id TEXT NOT NULL UNIQUE,
    agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    call_type public.call_type NOT NULL DEFAULT 'outbound',
    call_status public.call_status NOT NULL DEFAULT 'initiated',
    duration_seconds INT,
    recording_url TEXT,
    recording_duration_seconds INT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents can manage their call logs" ON public.call_logs FOR ALL USING (auth.uid() = agent_id);
CREATE POLICY "Admins can see all call logs" ON public.call_logs FOR SELECT USING (get_my_claim('user_role') = '"admin"' OR get_my_claim('user_role') = '"super_admin"');

-- Create field_visits table
CREATE TABLE public.field_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    visit_date DATE NOT NULL,
    visit_type public.visit_type NOT NULL DEFAULT 'property_visit',
    duration_minutes INT,
    latitude REAL,
    longitude REAL,
    address TEXT,
    photos TEXT[],
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.field_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents can manage their field visits" ON public.field_visits FOR ALL USING (auth.uid() = agent_id);
CREATE POLICY "Admins can see all field visits" ON public.field_visits FOR SELECT USING (get_my_claim('user_role') = '"admin"' OR get_my_claim('user_role') = '"super_admin"');


-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type public.notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    sent_via public.notification_channel NOT NULL DEFAULT 'app',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Create property_shares table
CREATE TABLE public.property_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    post_url TEXT,
    shared_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.property_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own shares" ON public.property_shares FOR SELECT USING (auth.uid() = shared_by);
CREATE POLICY "Admins can see all shares" ON public.property_shares FOR SELECT USING (get_my_claim('user_role') = '"admin"' OR get_my_claim('user_role') = '"super_admin"');


-- Create integration_settings table
CREATE TABLE public.integration_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_type public.integration_type NOT NULL,
    settings JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage integrations" ON public.integration_settings FOR ALL USING (get_my_claim('user_role') = '"admin"' OR get_my_claim('user_role') = '"super_admin"');
