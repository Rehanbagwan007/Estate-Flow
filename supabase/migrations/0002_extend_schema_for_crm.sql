-- Extend user roles to include all required roles
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'caller_1';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'caller_2';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sales_manager';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sales_executive_1';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sales_executive_2';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'customer';

-- Add approval status to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT FALSE;

-- Create property interests table
CREATE TABLE IF NOT EXISTS property_interests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    interest_level VARCHAR(20) DEFAULT 'interested' CHECK (interest_level IN ('interested', 'very_interested', 'ready_to_buy')),
    message TEXT,
    preferred_meeting_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'contacted', 'meeting_scheduled', 'completed', 'cancelled'))
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_interest_id UUID NOT NULL REFERENCES property_interests(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    location VARCHAR(255),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create call logs table
CREATE TABLE IF NOT EXISTS call_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    call_id VARCHAR(255) UNIQUE NOT NULL, -- Exotel call ID
    agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    call_type VARCHAR(20) DEFAULT 'outbound' CHECK (call_type IN ('inbound', 'outbound')),
    call_status VARCHAR(20) DEFAULT 'initiated' CHECK (call_status IN ('initiated', 'ringing', 'answered', 'completed', 'failed', 'busy', 'no_answer')),
    duration_seconds INTEGER DEFAULT 0,
    recording_url TEXT,
    recording_duration_seconds INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create field visits table for GPS tracking
CREATE TABLE IF NOT EXISTS field_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    visit_type VARCHAR(20) DEFAULT 'property_visit' CHECK (visit_type IN ('property_visit', 'customer_meeting', 'site_inspection', 'follow_up')),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER,
    notes TEXT,
    photos TEXT[], -- Array of photo URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('property_interest', 'appointment_reminder', 'call_reminder', 'approval_status', 'task_assigned', 'meeting_scheduled')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional data for the notification
    is_read BOOLEAN DEFAULT FALSE,
    sent_via VARCHAR(20) DEFAULT 'app' CHECK (sent_via IN ('app', 'email', 'whatsapp', 'sms')),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create integration settings table
CREATE TABLE IF NOT EXISTS integration_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    integration_type VARCHAR(50) NOT NULL CHECK (integration_type IN ('exotel', 'whatsapp', 'olx', '99acres', 'facebook', 'instagram')),
    settings JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agent assignments table
CREATE TABLE IF NOT EXISTS agent_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    property_interest_id UUID REFERENCES property_interests(id) ON DELETE SET NULL,
    assigned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assignment_type VARCHAR(20) DEFAULT 'property_interest' CHECK (assignment_type IN ('property_interest', 'follow_up', 'cold_call', 'meeting')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_property_interests_property_id ON property_interests(property_id);
CREATE INDEX IF NOT EXISTS idx_property_interests_customer_id ON property_interests(customer_id);
CREATE INDEX IF NOT EXISTS idx_property_interests_status ON property_interests(status);
CREATE INDEX IF NOT EXISTS idx_appointments_agent_id ON appointments(agent_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_call_logs_agent_id ON call_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_customer_id ON call_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON call_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_field_visits_agent_id ON field_visits(agent_id);
CREATE INDEX IF NOT EXISTS idx_field_visits_visit_date ON field_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_agent_id ON agent_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_customer_id ON agent_assignments(customer_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_status ON agent_assignments(status);

-- Add RLS policies for new tables
ALTER TABLE property_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_assignments ENABLE ROW LEVEL SECURITY;

-- Property interests policies
CREATE POLICY "Users can view their own property interests" ON property_interests
    FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Admins and agents can view all property interests" ON property_interests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'agent', 'sales_manager', 'sales_executive_1', 'sales_executive_2')
        )
    );

CREATE POLICY "Customers can create property interests" ON property_interests
    FOR INSERT WITH CHECK (
        customer_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'customer' 
            AND approval_status = 'approved'
        )
    );

-- Appointments policies
CREATE POLICY "Users can view their own appointments" ON appointments
    FOR SELECT USING (customer_id = auth.uid() OR agent_id = auth.uid());

CREATE POLICY "Admins can view all appointments" ON appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Call logs policies
CREATE POLICY "Agents can view their own call logs" ON call_logs
    FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Admins can view all call logs" ON call_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Field visits policies
CREATE POLICY "Agents can view their own field visits" ON field_visits
    FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Admins can view all field visits" ON field_visits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Agent assignments policies
CREATE POLICY "Agents can view their own assignments" ON agent_assignments
    FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Admins can view all assignments" ON agent_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'sales_manager')
        )
    );

-- Integration settings policies (admin only)
CREATE POLICY "Only admins can manage integration settings" ON integration_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );
