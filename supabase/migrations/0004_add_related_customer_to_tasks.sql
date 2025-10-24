-- Add the column to the tasks table
ALTER TABLE public.tasks
ADD COLUMN related_customer_id UUID;

-- Add the foreign key constraint to the new column
ALTER TABLE public.tasks
ADD CONSTRAINT tasks_related_customer_id_fkey
FOREIGN KEY (related_customer_id)
REFERENCES public.profiles (id)
ON DELETE SET NULL;
