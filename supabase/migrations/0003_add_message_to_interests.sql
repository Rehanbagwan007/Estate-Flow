-- Add message and preferred_meeting_time columns to property_interests table

ALTER TABLE public.property_interests
ADD COLUMN message TEXT,
ADD COLUMN preferred_meeting_time TIMESTAMP WITH TIME ZONE;
