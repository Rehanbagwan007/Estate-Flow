-- Users Table: Handled by Supabase Auth, but we have a public `profiles` table.

-- Enums
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

CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.property_status AS ENUM ('Available', 'Sold', 'Rented', 'Upcoming');
CREATE TYPE public.property_type AS ENUM ('Residential', 'Commercial', 'Land');
CREATE TYPE public.lead_status AS ENUM ('Hot', 'Warm', 'Cold');
CREATE TYPE public.task_status AS ENUM ('Todo', 'InProgress', 'Done');
CREATE TYPE public.interest_level AS ENUM ('interested', 'very_interested', 'ready_to_buy');
CREATE TYPE public.interest_status AS ENUM ('pending', 'assigned', 'contacted', 'meeting_scheduled', 'completed', 'cancelled');
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.call_status AS ENUM ('initiated', 'ringing', 'answered', 'completed', 'failed', 'busy', 'no_answer');
CREATE TYPE public.call_type AS ENUM ('inbound', 'outbound');
CREATE TYPE public.visit_type AS ENUM ('property_visit', 'customer_meeting', 'site_inspection', 'follow_up');
CREATE TYPE public.notification_type AS ENUM ('property_interest', 'appointment_reminder', 'call_reminder', 'approval_status', 'task_assigned', 'meeting_scheduled');
CREATE TYPE public.notification_channel AS ENUM ('app', 'email', 'whatsapp', 'sms');
CREATE TYPE public.integration_type AS ENUM ('exotel', 'whatsapp', 'olx', '99acres', 'facebook', 'instagram');
CREATE TYPE public.assignment_type AS ENUM ('property_interest', 'follow_up', 'cold_call', 'meeting');
CREATE TYPE public.assignment_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.assignment_status AS ENUM ('assigned', 'accepted', 'in_progress', 'completed', 'cancelled');

-- Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    role user_role NOT NULL DEFAULT 'customer',
    approval_status approval_status NOT NULL DEFAULT 'pending',
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.profiles IS 'Stores user profile information, extending the auth.users table.';

-- Properties Table
CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    property_type property_type NOT NULL DEFAULT 'Residential',
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    price NUMERIC NOT NULL,
    bedrooms INT,
    bathrooms NUMERIC,
    area_sqft INT,
    status property_status NOT NULL DEFAULT 'Available',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.properties IS 'Stores property listings.';

-- Leads Table
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    status lead_status NOT NULL,
    assigned_to UUID REFERENCES public.profiles(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.leads IS 'Stores potential client leads.';

-- Tasks Table
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    status task_status NOT NULL,
    assigned_to UUID REFERENCES public.profiles(id),
    related_lead_id UUID REFERENCES public.leads(id),
    related_property_id UUID REFERENCES public.properties(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.tasks IS 'Manages tasks for agents and admins.';

-- Property Interests Table
CREATE TABLE public.property_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id),
    customer_id UUID NOT NULL REFERENCES public.profiles(id),
    interest_level interest_level NOT NULL,
    message TEXT,
    preferred_meeting_time TIMESTAMPTZ,
    status interest_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.property_interests IS 'Tracks customer interest in properties.';

-- Appointments Table
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_interest_id UUID NOT NULL REFERENCES public.property_interests(id),
    customer_id UUID NOT NULL REFERENCES public.profiles(id),
    agent_id UUID NOT NULL REFERENCES public.profiles(id),
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INT,
    location TEXT,
    status appointment_status NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.appointments IS 'Schedules meetings between customers and agents.';

-- Call Logs Table
CREATE TABLE public.call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id TEXT NOT NULL UNIQUE, -- From Exotel or other provider
    agent_id UUID NOT NULL REFERENCES public.profiles(id),
    customer_id UUID NOT NULL REFERENCES public.profiles(id),
    property_id UUID REFERENCES public.properties(id),
    call_type call_type NOT NULL,
    call_status call_status NOT NULL,
    duration_seconds INT,
    recording_url TEXT,
    recording_duration_seconds INT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.call_logs IS 'Logs call information and recordings.';

-- Field Visits Table (For GPS Tracking)
CREATE TABLE public.field_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.profiles(id),
    property_id UUID REFERENCES public.properties(id),
    visit_date DATE NOT NULL,
    visit_type visit_type NOT NULL,
    latitude NUMERIC,
    longitude NUMERIC,
    address TEXT,
    duration_minutes INT,
    photos TEXT[],
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.field_visits IS 'Tracks agent field visits and locations.';

-- Notifications Table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB,
    sent_via notification_channel NOT NULL DEFAULT 'app',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.notifications IS 'Manages system-wide notifications.';

-- Integration Settings Table
CREATE TABLE public.integration_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_type integration_type NOT NULL UNIQUE,
    settings JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.integration_settings IS 'Stores API keys and settings for third-party integrations.';

-- Agent Assignments Table
CREATE TABLE public.agent_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_interest_id UUID REFERENCES public.property_interests(id),
    customer_id UUID NOT NULL REFERENCES public.profiles(id),
    agent_id UUID NOT NULL REFERENCES public.profiles(id),
    assigned_by UUID NOT NULL REFERENCES public.profiles(id),
    assignment_type assignment_type NOT NULL,
    priority assignment_priority NOT NULL DEFAULT 'medium',
    status assignment_status NOT NULL DEFAULT 'assigned',
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.agent_assignments IS 'Assigns customers or interests to agents.';

-- Property Media Table
CREATE TABLE public.property_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.property_media IS 'Stores images and documents for properties.';

-- Property Shares Table
CREATE TABLE public.property_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    post_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.property_shares IS 'Stores URLs of social media posts for properties.';


-- Function to create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, role, phone)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.email,
    (new.raw_user_meta_data->>'role')::public.user_role,
    new.phone
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- Properties
CREATE POLICY "All users can view available properties"
  ON public.properties FOR SELECT
  USING (status = 'Available');

CREATE POLICY "Agents can manage their own properties"
  ON public.properties FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all properties"
  ON public.properties FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- Leads
CREATE POLICY "Agents can view leads assigned to them"
  ON public.leads FOR SELECT
  USING (auth.uid() = assigned_to);

CREATE POLICY "Admins can manage all leads"
  ON public.leads FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- Property Interests
CREATE POLICY "Customers can manage their own interests"
  ON public.property_interests FOR ALL
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admins and assigned agents can view interests"
  ON public.property_interests FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
    OR
    id IN (SELECT property_interest_id FROM public.agent_assignments WHERE agent_id = auth.uid())
  );


-- Storage Policies
CREATE POLICY "Property media is publicly readable"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'property_media' );

CREATE POLICY "Users can upload to their own property folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property_media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own property media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'property_media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
