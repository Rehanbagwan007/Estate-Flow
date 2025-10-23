-- Create User Roles Enum
CREATE TYPE user_role AS ENUM ('admin', 'agent');

-- Create Lead Status Enum
CREATE TYPE lead_status AS ENUM ('Hot', 'Warm', 'Cold');

-- Create Property Status Enum
CREATE TYPE property_status AS ENUM ('Available', 'Sold', 'Rented', 'Upcoming');

-- Create Task Status Enum
CREATE TYPE task_status AS ENUM ('Todo', 'InProgress', 'Done');

-- Profiles Table to store user information and roles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'agent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Properties Table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  bedrooms INT,
  bathrooms NUMERIC(3, 1),
  area_sqft INT,
  status property_status NOT NULL DEFAULT 'Upcoming',
  owner_name TEXT,
  owner_contact TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Property Media Table for images and documents
CREATE TABLE property_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_type TEXT, -- e.g., 'image', 'document'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leads Table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  status lead_status NOT NULL DEFAULT 'Warm',
  assigned_to UUID REFERENCES profiles(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lead Notes Table for activity log
CREATE TABLE lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  status task_status NOT NULL DEFAULT 'Todo',
  assigned_to UUID REFERENCES profiles(id),
  related_lead_id UUID REFERENCES leads(id),
  related_property_id UUID REFERENCES properties(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable RLS for all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: Users can see their own profile. Admins can see all.
CREATE POLICY "Users can view their own profile." ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles." ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can update their own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Properties: Agents can see all properties. Agents can manage properties they created. Admins can manage all.
CREATE POLICY "Authenticated users can view all properties." ON properties FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert their own properties." ON properties FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own properties." ON properties FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Admins can manage all properties." ON properties FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Leads: Agents can see leads assigned to them. Admins can see all.
CREATE POLICY "Agents can see leads assigned to them." ON leads FOR SELECT USING (auth.uid() = assigned_to);
CREATE POLICY "Admins can see all leads." ON leads FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Agents can insert new leads." ON leads FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Agents can update their assigned leads." ON leads FOR UPDATE USING (auth.uid() = assigned_to);
CREATE POLICY "Admins can manage all leads." ON leads FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Tasks: Agents can see tasks assigned to them. Admins can see all.
CREATE POLICY "Agents can see tasks assigned to them." ON tasks FOR SELECT USING (auth.uid() = assigned_to);
CREATE POLICY "Admins can see all tasks." ON tasks FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Agents can insert new tasks." ON tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Agents can update their assigned tasks." ON tasks FOR UPDATE USING (auth.uid() = assigned_to);
CREATE POLICY "Admins can manage all tasks." ON tasks FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
