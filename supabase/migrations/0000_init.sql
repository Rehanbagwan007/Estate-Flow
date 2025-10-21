
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
CREATE TYPE public.property_status AS ENUM ('Available', 'Sold', 'Rented', 'Upcoming');
CREATE TYPE public.lead_status AS ENUM ('Hot', 'Warm', 'Cold');
CREATE TYPE public.task_status AS ENUM ('Todo', 'InProgress', 'Done');

-- Profiles Table
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name text,
    last_name text,
    email text UNIQUE,
    phone text,
    role user_role DEFAULT 'agent'::public.user_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'agent')::user_role -- Use selected role or default to agent
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Properties Table
CREATE TABLE public.properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    description text,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    zip_code text NOT NULL,
    price numeric NOT NULL,
    bedrooms numeric,
    bathrooms numeric,
    area_sqft numeric,
    status property_status DEFAULT 'Available'::public.property_status NOT NULL,
    owner_name text,
    owner_contact text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to properties" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Allow users to insert their own properties" ON public.properties FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Allow users to update their own properties" ON public.properties FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Allow users to delete their own properties" ON public.properties FOR DELETE USING (auth.uid() = created_by);

-- Leads Table
CREATE TABLE public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    first_name text NOT NULL,
    last_name text,
    email text,
    phone text,
    status lead_status DEFAULT 'Warm'::public.lead_status NOT NULL,
    assigned_to uuid REFERENCES public.profiles(id),
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to assigned leads or all if admin" ON public.leads FOR SELECT USING (
    (assigned_to = (SELECT id FROM public.profiles WHERE id = auth.uid())) OR
    ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'::public.user_role)
);
CREATE POLICY "Allow users to insert leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow assigned users or admin to update leads" ON public.leads FOR UPDATE USING (
    (assigned_to = (SELECT id FROM public.profiles WHERE id = auth.uid())) OR
    ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'::public.user_role)
);
CREATE POLICY "Allow admin to delete leads" ON public.leads FOR DELETE USING (((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'::public.user_role));

-- Tasks Table
CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    description text,
    due_date timestamp with time zone,
    status task_status DEFAULT 'Todo'::public.task_status NOT NULL,
    assigned_to uuid REFERENCES public.profiles(id),
    related_lead_id uuid REFERENCES public.leads(id),
    related_property_id uuid REFERENCES public.properties(id),
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to assigned tasks or all if admin" ON public.tasks FOR SELECT USING (
    (assigned_to = (SELECT id FROM public.profiles WHERE id = auth.uid())) OR
    ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'::public.user_role)
);
CREATE POLICY "Allow users to insert tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow assigned users or admin to update tasks" ON public.tasks FOR UPDATE USING (
    (assigned_to = (SELECT id FROM public.profiles WHERE id = auth.uid())) OR
    ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'::public.user_role)
);
CREATE POLICY "Allow admin to delete tasks" ON public.tasks FOR DELETE USING (((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'::public.user_role));


-- Lead Notes Table
CREATE TABLE public.lead_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
    note text NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to lead notes" ON public.lead_notes FOR ALL USING (true) WITH CHECK (true);

-- Property Media Table
CREATE TABLE public.property_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
    file_path text NOT NULL,
    file_type text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to property media" ON public.property_media FOR ALL USING (true) WITH CHECK (true);


-- Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES
('property_media', 'property_media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read access" ON storage.objects FOR SELECT TO anon, authenticated USING ( bucket_id = 'property_media' );
CREATE POLICY "Allow authenticated users to upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'property_media' );
CREATE POLICY "Allow owner to update" ON storage.objects FOR UPDATE TO authenticated USING ( auth.uid()::text = owner_id );
CREATE POLICY "Allow owner to delete" ON storage.objects FOR DELETE TO authenticated USING ( auth.uid()::text = owner_id );
