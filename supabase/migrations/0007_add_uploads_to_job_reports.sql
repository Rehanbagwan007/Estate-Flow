-- 1. Add site_visit_locations to job_reports table
ALTER TABLE public.job_reports
ADD COLUMN site_visit_locations TEXT;

-- 2. Create job_report_media table
CREATE TABLE public.job_report_media (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    report_id UUID NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT job_report_media_pkey PRIMARY KEY (id),
    CONSTRAINT job_report_media_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.job_reports(id) ON DELETE CASCADE
);

-- 3. Create a bucket for job report media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('job_report_media', 'job_report_media', TRUE, 5242880, '{"image/*"}'
) ON CONFLICT (id) DO NOTHING;


-- 4. RLS policies for job_report_media
ALTER TABLE public.job_report_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage media for their own reports"
ON public.job_report_media FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.job_reports
    WHERE job_reports.id = job_report_media.report_id AND job_reports.user_id = auth.uid()
  )
);

CREATE POLICY "Admins and managers can view all media"
ON public.job_report_media FOR SELECT
USING (
  (
    SELECT role
    FROM public.profiles
    WHERE id = auth.uid()
  ) IN ('admin', 'super_admin', 'sales_manager')
);
