'use client';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TaskList } from '@/components/tasks/task-list';
import type { Profile, Task, TaskMedia, Property } from '@/lib/types';
import { useTaskStore } from '@/lib/store/task-store';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { TaskDetailsDialog } from '@/components/tasks/task-details-dialog';
import { ExotelCallInterface } from '@/components/calls/exotel-call-interface';
import { TaskFilters } from '@/components/tasks/task-filters';

interface EnrichedTask extends Task {
  task_media?: TaskMedia[] | null;
  customer?: Profile | null;
  property?: Property | null;
  assigned_to_profile?: Profile | null;
}

interface TasksClientProps {
  initialTasks: EnrichedTask[];
  teamMembers: Profile[];
  userRole: Profile['role'];
  userId: string;
}

export function TasksClient({ initialTasks, teamMembers, userRole, userId }: TasksClientProps) {
  const { tasks, setTasks } = useTaskStore();
  const initialized = useRef(false);

  const [filteredTasks, setFilteredTasks] = useState(initialTasks);
  const [selectedTask, setSelectedTask] = useState<EnrichedTask | null>(null);
  const [callTarget, setCallTarget] = useState<{ customerId: string; customerPhone: string; customerName: string } | null>(null);

  useEffect(() => {
    if (!initialized.current) {
      setTasks(initialTasks);
      setFilteredTasks(initialTasks);
      initialized.current = true;
    }
  }, [initialTasks, setTasks]);

  useEffect(() => {
    // This keeps the local filtered list in sync with the global store,
    // which is important if tasks are updated elsewhere.
    setFilteredTasks(tasks);
  }, [tasks]);

  const handleFilterChange = useCallback((newFilteredTasks: EnrichedTask[]) => {
    setFilteredTasks(newFilteredTasks);
  }, []);
  
  const canCreateTasks = ['super_admin', 'admin', 'sales_manager'].includes(userRole);

  const handleCallClick = (target: { customerId: string; customerPhone: string; customerName: string }) => {
    if (target.customerPhone) {
        setCallTarget(target);
    } else {
        alert('Customer phone number is not available.');
    }
  };

  const handleCallEnd = () => {
    setCallTarget(null);
  };

  const handleTaskUpdate = () => {
    setSelectedTask(null);
    // Re-fetching or manual state update could happen here,
    // but revalidation from server action is preferred.
  };

  return (
    <>
      <TaskDetailsDialog
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onCall={handleCallClick}
        onUpdate={handleTaskUpdate}
      />
      {callTarget && (
        <ExotelCallInterface 
            agentId={userId} 
            callTarget={callTarget}
            onCallEnd={handleCallEnd}
        />
      )}
      <div className="space-y-4">
        <div className="flex items-center">
            <TaskFilters 
                allTasks={tasks as EnrichedTask[]} 
                teamMembers={teamMembers}
                onFilterChange={handleFilterChange}
                showTeamFilter={canCreateTasks}
              />
          <div className="ml-auto flex items-center gap-2">
            {canCreateTasks && (
                <Button size="sm" className="h-7 gap-1 text-sm" asChild>
                    <Link href="/tasks/new">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only">New Task</span>
                    </Link>
                </Button>
            )}
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>Manage your team's tasks and reminders.</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskList tasks={filteredTasks} onCall={handleCallClick} onTaskSelect={setSelectedTask} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
