
ALTER TABLE public.leads
ADD COLUMN source TEXT;

-- Add RLS policies for the new column if needed, assuming admins/assigned users can see it.
-- For now, we rely on existing table-level policies which should cover this new column.
