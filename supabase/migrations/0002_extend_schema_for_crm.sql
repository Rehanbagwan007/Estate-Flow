-- =================================================================
--  USER ROLES & PROFILES
-- =================================================================

-- Create user roles
CREATE TYPE public.user_role AS ENUM (
    'super_admin', 'admin', 'agent', 'caller_1', 'caller_2',
    'sales_manager', 'sales_executive_1', 'sales_executive_2', 'customer'
);

-- Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    role user_role NOT NULL DEFAULT 'customer',
    approval_status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, email, phone, role)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'first_name',
        new.raw_user_meta_data->>'last_name',
        new.email,
        new.raw_user_meta_data->>'phone',
        (new.raw_user_meta_data->>'role')::user_role
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =================================================================
--  CORE CRM TABLES
-- =================================================================

-- Properties Table
CREATE TYPE public.property_status AS ENUM ('Available', 'Sold', 'Rented', 'Upcoming');
CREATE TYPE public.property_type AS ENUM ('Residential', 'Commercial', 'Land');

CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    property_type property_type NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    bedrooms INT,
    bathrooms NUMERIC(3, 1),
    area_sqft INT,
    status property_status NOT NULL DEFAULT 'Available',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Property Media Table
CREATE TABLE public.property_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Property Shares Table (for social media links)
CREATE TABLE public.property_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    post_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(property_id, platform)
);

-- Property Interests Table
CREATE TYPE public.interest_level AS ENUM ('interested', 'very_interested', 'ready_to_buy');
CREATE TYPE public.interest_status AS ENUM ('pending', 'assigned', 'contacted', 'meeting_scheduled', 'completed', 'cancelled');

CREATE TABLE public.property_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    interest_level interest_level NOT NULL DEFAULT 'interested',
    status interest_status NOT NULL DEFAULT 'pending',
    message TEXT,
    preferred_meeting_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leads Table
CREATE TYPE public.lead_status AS ENUM ('Hot', 'Warm', 'Cold');

CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    status lead_status NOT NULL DEFAULT 'Warm',
    assigned_to UUID REFERENCES public.profiles(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agent Assignments Table
CREATE TYPE public.assignment_type AS ENUM ('property_interest', 'follow_up', 'cold_call', 'meeting');
CREATE TYPE public.assignment_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.assignment_status AS ENUM ('assigned', 'accepted', 'in_progress', 'completed', 'cancelled');

CREATE TABLE public.agent_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_interest_id UUID REFERENCES public.property_interests(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assignment_type assignment_type NOT NULL DEFAULT 'property_interest',
    priority assignment_priority NOT NULL DEFAULT 'medium',
    status assignment_status NOT NULL DEFAULT 'assigned',
    notes TEXT,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Appointments Table
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');

CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_interest_id UUID NOT NULL REFERENCES public.property_interests(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INT,
    location TEXT,
    status appointment_status NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tasks Table
CREATE TYPE public.task_status AS ENUM ('Todo', 'InProgress', 'Done');

CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status task_status NOT NULL DEFAULT 'Todo',
    due_date TIMESTAMPTZ,
    assigned_to UUID REFERENCES public.profiles(id),
    created_by UUID REFERENCES auth.users(id),
    related_lead_id UUID REFERENCES public.leads(id),
    related_property_id UUID REFERENCES public.properties(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =================================================================
--  COMMUNICATION & LOGGING
-- =================================================================

-- Call Logs Table
CREATE TYPE public.call_type AS ENUM ('inbound', 'outbound');
CREATE TYPE public.call_status AS ENUM ('initiated', 'ringing', 'answered', 'completed', 'failed', 'busy', 'no_answer');

CREATE TABLE public.call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id TEXT UNIQUE NOT NULL, -- Exotel or other provider's call ID
    agent_id UUID NOT NULL REFERENCES public.profiles(id),
    customer_id UUID REFERENCES public.profiles(id),
    call_type call_type NOT NULL,
    call_status call_status NOT NULL,
    duration_seconds INT,
    recording_url TEXT,
    recording_duration_seconds INT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications Table
CREATE TYPE public.notification_type AS ENUM ('property_interest', 'appointment_reminder', 'call_reminder', 'approval_status', 'task_assigned', 'meeting_scheduled');
CREATE TYPE public.notification_channel AS ENUM ('app', 'email', 'whatsapp', 'sms');

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    sent_via notification_channel NOT NULL DEFAULT 'app',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =================================================================
--  FIELD OPERATIONS
-- =================================================================

-- Field Visits Table
CREATE TYPE public.visit_type AS ENUM ('property_visit', 'customer_meeting', 'site_inspection', 'follow_up');

CREATE TABLE public.field_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.profiles(id),
    property_id UUID REFERENCES public.properties(id),
    visit_date DATE NOT NULL,
    visit_type visit_type NOT NULL,
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    address TEXT,
    duration_minutes INT,
    notes TEXT,
    photos TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =================================================================
--  SYSTEM & INTEGRATIONS
-- =================================================================

-- Integration Settings Table
CREATE TYPE public.integration_type AS ENUM ('exotel', 'whatsapp', 'olx', '99acres', 'facebook', 'instagram');

CREATE TABLE public.integration_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_type integration_type NOT NULL UNIQUE,
    settings JSONB NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =================================================================
--  ROW LEVEL SECURITY (RLS) POLICIES
-- =================================================================
-- IMPORTANT: These policies are critical for data security.

-- RLS for PROFILES table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow admins to manage all profiles" ON public.profiles;

CREATE POLICY "Allow authenticated users to read profiles" ON public.profiles
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow users to update their own profile" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Allow admins to manage all profiles" ON public.profiles
FOR ALL TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'));


-- RLS for PROPERTIES table
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all users to read properties" ON public.properties;
DROP POLICY IF EXISTS "Allow admins and agents to manage properties" ON public.properties;

CREATE POLICY "Allow all users to read properties" ON public.properties
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admins and agents to manage properties" ON public.properties
FOR ALL TO authenticated USING (((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'agent')))
WITH CHECK (((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'agent')));


-- RLS for PROPERTY_INTERESTS table
ALTER TABLE public.property_interests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow customer to manage their own interests" ON public.property_interests;
DROP POLICY IF EXISTS "Allow admins and agents to view interests" ON public.property_interests;

CREATE POLICY "Allow customer to manage their own interests" ON public.property_interests
FOR ALL TO authenticated USING (auth.uid() = customer_id);

CREATE POLICY "Allow admins and agents to view interests" ON public.property_interests
FOR SELECT TO authenticated USING (((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'agent')));
