ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS files JSONB[] DEFAULT '[]'::jsonb[];