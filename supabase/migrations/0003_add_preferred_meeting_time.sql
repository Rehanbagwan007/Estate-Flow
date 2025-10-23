-- Add preferred meeting time to property_interests
ALTER TABLE public.property_interests
ADD COLUMN preferred_meeting_time TIMESTAMPTZ;
