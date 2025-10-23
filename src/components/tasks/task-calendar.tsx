'use client';

import { Calendar } from '@/components/ui/calendar';
import type { Task } from '@/lib/types';
import { useState } from 'react';
import { Badge } from '../ui/badge';

interface TaskCalendarProps {
  tasks: Task[];
}

export function TaskCalendar({ tasks }: TaskCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const taskDates = tasks.map(task => task.due_date ? new Date(task.due_date) : undefined).filter(Boolean) as Date[];

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-md border"
      modifiers={{ scheduled: taskDates }}
      modifiersStyles={{
        scheduled: { 
            color: 'hsl(var(--primary-foreground))',
            backgroundColor: 'hsl(var(--primary))',
        },
      }}
      components={{
        DayContent: (props) => {
            const tasksForDay = tasks.filter(task => task.due_date && new Date(task.due_date).toDateString() === props.date.toDateString());
            if(tasksForDay.length > 0) {
                return <div className="relative flex items-center justify-center h-full w-full">
                    {props.date.getDate()}
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 justify-center text-xs">{tasksForDay.length}</Badge>
                </div>
            }
            return <div className="flex items-center justify-center h-full w-full">{props.date.getDate()}</div>
        }
      }}
    />
  );
}
