-- Add message and preferred_meeting_time to property_interests table
ALTER TABLE public.property_interests
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS preferred_meeting_time TIMESTAMPTZ;

-- Drop the existing policy if it exists
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.property_interests;

-- Recreate the policy to allow authenticated users to insert
CREATE POLICY "Enable insert for authenticated users only"
ON public.property_interests
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also ensure RLS is enabled on the table
ALTER TABLE public.property_interests ENABLE ROW LEVEL SECURITY;
