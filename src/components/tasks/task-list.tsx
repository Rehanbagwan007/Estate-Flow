'use client';

import type { Task } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { format, formatDistanceToNow } from 'date-fns';

interface TaskListProps {
  tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-start gap-4 rounded-lg border p-4">
          <Checkbox id={`task-${task.id}`} className="mt-1" checked={task.status === 'Done'} />
          <div className="grid gap-1">
            <label htmlFor={`task-${task.id}`} className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {task.title}
            </label>
            <p className="text-sm text-muted-foreground">
              {task.description}
            </p>
            {task.due_date && (
                 <p className="text-sm text-muted-foreground">
                    Due {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
                 </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
