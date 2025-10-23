
-- Drop existing objects to start fresh and avoid conflicts
-- This makes the script idempotent
DO $$
BEGIN
    DROP TABLE IF EXISTS public.agent_assignments CASCADE;
    DROP TABLE IF EXISTS public.tasks CASCADE;
    DROP TABLE IF EXISTS public.property_shares CASCADE;
    DROP TABLE IF EXISTS public.appointments CASCADE;
    DROP TABLE IF EXISTS public.call_logs CASCADE;
    DROP TABLE IF EXISTS public.field_visits CASCADE;
    DROP TABLE IF EXISTS public.notifications CASCADE;
    DROP TABLE IF EXISTS public.integration_settings CASCADE;
    DROP TABLE IF EXISTS public.property_interests CASCADE;

    DROP TYPE IF EXISTS public.property_type;
    DROP TYPE IF EXISTS public.task_status;
    DROP TYPE IF EXISTS public.assignment_type;
    DROP TYPE IF EXISTS public.assignment_status;
    DROP TYPE IF EXISTS public.assignment_priority;
    DROP TYPE IF EXISTS public.appointment_status;
    DROP TYPE IF EXISTS public.call_type;
    DROP TYPE IF EXISTS public.call_status;
    DROP TYPE IF EXISTS public.visit_type;
    DROP TYPE IF EXISTS public.notification_type;
    DROP TYPE IF EXISTS public.notification_channel;
    DROP TYPE IF EXISTS public.integration_type;
    DROP TYPE IF EXISTS public.interest_level;
    DROP TYPE IF EXISTS public.interest_status;
END$$;


-- Create all custom ENUM types correctly
CREATE TYPE public.property_type AS ENUM ('Residential', 'Commercial', 'Land');
CREATE TYPE public.task_status AS ENUM ('Todo', 'InProgress', 'Done');
CREATE TYPE public.assignment_type AS ENUM ('property_interest', 'follow_up', 'cold_call', 'meeting');
CREATE TYPE public.assignment_status AS ENUM ('assigned', 'accepted', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.assignment_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.interest_level AS ENUM ('interested', 'very_interested', 'ready_to_buy');
CREATE TYPE public.interest_status AS ENUM ('pending', 'assigned', 'contacted', 'meeting_scheduled', 'completed', 'cancelled');
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.call_type AS ENUM ('inbound', 'outbound');
CREATE TYPE public.call_status AS ENUM ('initiated', 'ringing', 'answered', 'completed', 'failed', 'busy', 'no_answer');
CREATE TYPE public.visit_type AS ENUM ('property_visit', 'customer_meeting', 'site_inspection', 'follow_up');
CREATE TYPE public.notification_type AS ENUM ('property_interest', 'appointment_reminder', 'call_reminder', 'approval_status', 'task_assigned', 'meeting_scheduled');
CREATE TYPE public.notification_channel AS ENUM ('app', 'email', 'whatsapp', 'sms');
CREATE TYPE public.integration_type AS ENUM ('exotel', 'whatsapp', 'olx', '99acres', 'facebook', 'instagram');

-- Create property_interests table with UUID primary key
CREATE TABLE IF NOT EXISTS public.property_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    interest_level public.interest_level NOT NULL DEFAULT 'interested',
    status public.interest_status NOT NULL DEFAULT 'pending',
    message TEXT,
    preferred_meeting_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create agent_assignments table with correct foreign key type
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

-- Create all other necessary tables
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

CREATE TABLE IF NOT EXISTS public.property_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    post_url TEXT,
    shared_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- Re-create the function and trigger to be safe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, email, phone, role, approval_status)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'first_name',
        new.raw_user_meta_data->>'last_name',
        new.email,
        new.raw_user_meta_data->>'phone',
        (new.raw_user_meta_data->>'role')::public.user_role,
        'approved' -- Set to approved since admin is creating the user
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
