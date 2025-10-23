-- Create all custom ENUM types first to avoid dependency issues
CREATE TYPE public.user_role AS ENUM (
    'super_admin',
    'admin',
    'agent',
    'caller_1',
    'caller_2',
    'sales_manager',
    'sales_executive_1',
    'sales_executive_2',
    'customer'
);

CREATE TYPE public.property_status AS ENUM (
    'Available',
    'Sold',
    'Rented',
    'Upcoming'
);

CREATE TYPE public.property_type AS ENUM (
    'Residential',
    'Commercial',
    'Land'
);

CREATE TYPE public.lead_status AS ENUM (
    'Hot',
    'Warm',
    'Cold'
);

CREATE TYPE public.task_status AS ENUM (
    'Todo',
    'InProgress',
    'Done'
);

CREATE TYPE public.interest_level AS ENUM (
    'interested',
    'very_interested',
    'ready_to_buy'
);

CREATE TYPE public.interest_status AS ENUM (
    'pending',
    'assigned',
    'contacted',
    'meeting_scheduled',
    'completed',
    'cancelled'
);

CREATE TYPE public.appointment_status AS ENUM (
    'scheduled',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
    'no_show'
);

CREATE TYPE public.call_type AS ENUM (
    'inbound',
    'outbound'
);

CREATE TYPE public.call_status AS ENUM (
    'initiated',
    'ringing',
    'answered',
    'completed',
    'failed',
    'busy',
    'no_answer'
);

CREATE TYPE public.visit_type AS ENUM (
    'property_visit',
    'customer_meeting',
    'site_inspection',
    'follow_up'
);

CREATE TYPE public.notification_type AS ENUM (
    'property_interest',
    'appointment_reminder',
    'call_reminder',
    'approval_status',
    'task_assigned',
    'meeting_scheduled'
);

CREATE TYPE public.notification_channel AS ENUM (
    'app',
    'email',
    'whatsapp',
    'sms'
);

CREATE TYPE public.integration_type AS ENUM (
    'exotel',
    'whatsapp',
    'olx',
    '99acres',
    'facebook',
    'instagram'
);

CREATE TYPE public.assignment_type AS ENUM (
    'property_interest',
    'follow_up',
    'cold_call',
    'meeting'
);

CREATE TYPE public.assignment_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);

CREATE TYPE public.assignment_status AS ENUM (
    'assigned',
    'accepted',
    'in_progress',
    'completed',
    'cancelled'
);


-- Create tables with IF NOT EXISTS to be safe
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

-- Add foreign keys if they don't exist
ALTER TABLE public.leads
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id);

ALTER TABLE public.lead_notes
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id);

ALTER TABLE public.properties
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id),
    ADD COLUMN IF NOT EXISTS related_lead_id UUID REFERENCES public.leads(id),
    ADD COLUMN IF NOT EXISTS related_property_id UUID REFERENCES public.properties(id);

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS approval_status TEXT,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id);
    
ALTER TABLE public.property_interests
    ADD COLUMN IF NOT EXISTS message TEXT,
    ADD COLUMN IF NOT EXISTS preferred_meeting_time TIMESTAMPTZ;

-- Grant permissions
GRANT ALL ON TABLE public.agent_assignments TO authenticated, service_role;
