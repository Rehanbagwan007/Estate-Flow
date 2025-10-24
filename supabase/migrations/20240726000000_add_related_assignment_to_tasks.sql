
ALTER TABLE public.tasks
ADD COLUMN related_assignment_id UUID;

ALTER TABLE public.tasks
ADD CONSTRAINT fk_tasks_related_assignment_id
FOREIGN KEY (related_assignment_id)
REFERENCES public.agent_assignments (id)
ON DELETE SET NULL;
