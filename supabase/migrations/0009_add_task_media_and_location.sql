-- 1. Add location column to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS location_address text;

-- 2. Create the task_media table
CREATE TABLE IF NOT EXISTS public.task_media (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL,
    file_path text NOT NULL,
    file_type character varying NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT task_media_pkey PRIMARY KEY (id),
    CONSTRAINT task_media_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE
);

-- 3. Create a bucket for task_media if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'task_media', 'task_media', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif']
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'task_media'
);

-- 4. Enable RLS for the new table
ALTER TABLE public.task_media ENABLE ROW LEVEL SECURITY;

-- 5. Add RLS policies for task_media
DROP POLICY IF EXISTS "Users can manage their own task media" ON public.task_media;
CREATE POLICY "Users can manage their own task media"
ON public.task_media FOR ALL
USING (
  (
    SELECT assigned_to
    FROM public.tasks
    WHERE id = task_id
  ) = auth.uid() OR
  (
    SELECT created_by
    FROM public.tasks
    WHERE id = task_id
  ) = auth.uid()
);

DROP POLICY IF EXISTS "Admins and managers can view all task media" ON public.task_media;
CREATE POLICY "Admins and managers can view all task media"
ON public.task_media FOR SELECT
USING (
  (
    SELECT role
    FROM public.profiles
    WHERE id = auth.uid()
  ) IN ('admin', 'super_admin', 'sales_manager')
);
