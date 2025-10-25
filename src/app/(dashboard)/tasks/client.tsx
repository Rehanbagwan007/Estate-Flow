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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { TaskList } from '@/components/tasks/task-list';
import { TaskCalendar } from '@/components/tasks/task-calendar';
import type { Profile, Task, TaskMedia } from '@/lib/types';
import { useTaskStore } from '@/lib/store/task-store';
import { useEffect, useRef } from 'react';
import Link from 'next/link';

interface EnrichedTask extends Task {
  task_media?: TaskMedia[] | null;
  customer?: Profile | null;
}

interface TasksClientProps {
  initialTasks: EnrichedTask[];
  userRole: Profile['role'];
}

export function TasksClient({ initialTasks, userRole }: TasksClientProps) {
  const setTasks = useTaskStore((state) => state.setTasks);
  const tasks = useTaskStore((state) => state.tasks);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      setTasks(initialTasks);
      initialized.current = true;
    }
  }, [initialTasks, setTasks]);
  
  const canCreateTasks = ['super_admin', 'admin', 'sales_manager'].includes(userRole);

  return (
    <Tabs defaultValue="list">
    <div className="flex items-center">
      <TabsList>
        <TabsTrigger value="list">List</TabsTrigger>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
      </TabsList>
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
    <TabsContent value="list">
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>Manage your tasks and reminders.</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskList tasks={tasks as EnrichedTask[]} onCall={() => {}} onTaskSelect={() => {}} />
        </CardContent>
      </Card>
    </TabsContent>
    <TabsContent value="calendar">
      <Card>
        <CardHeader>
          <CardTitle>Task Calendar</CardTitle>
          <CardDescription>View your tasks on a calendar.</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskCalendar tasks={tasks} />
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>
  );
}
