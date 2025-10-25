-- Create enum for report status
CREATE TYPE public.job_report_status AS ENUM (
    'submitted',
    'approved',
    'rejected'
);

-- Create the job_reports table
CREATE TABLE public.job_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    report_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    details TEXT NOT NULL,
    travel_distance_km NUMERIC(10, 2),
    site_visits INT,
    status public.job_report_status NOT NULL DEFAULT 'submitted',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_report_date UNIQUE (user_id, report_date)
);

-- RLS Policies for job_reports
ALTER TABLE public.job_reports ENABLE ROW LEVEL SECURITY;

-- Users can see their own reports
CREATE POLICY "Users can see their own reports"
ON public.job_reports FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own reports
CREATE POLICY "Users can create their own reports"
ON public.job_reports FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reports if status is 'submitted'
CREATE POLICY "Users can update their own submitted reports"
ON public.job_reports FOR UPDATE
USING (auth.uid() = user_id AND status = 'submitted');

-- Admins/Super Admins can see reports submitted to them
CREATE POLICY "Managers can see reports submitted to them"
ON public.job_reports FOR SELECT
USING (auth.uid() = report_to);

-- Admins/Super Admins can approve/reject reports
CREATE POLICY "Managers can update status of reports submitted to them"
ON public.job_reports FOR UPDATE
USING (auth.uid() = report_to)
WITH CHECK (auth.uid() = report_to);

-- Indexes for performance
CREATE INDEX idx_job_reports_user_id ON public.job_reports(user_id);
CREATE INDEX idx_job_reports_report_to ON public.job_reports(report_to);
CREATE INDEX idx_job_reports_report_date ON public.job_reports(report_date);
