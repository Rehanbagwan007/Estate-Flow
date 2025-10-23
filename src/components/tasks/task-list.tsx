'use client';

import type { Task, Property, Profile } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Building2, Phone, User, Info } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useState } from 'react';
import { TaskDetailsDialog } from './task-details-dialog';

interface EnrichedTask extends Task {
    property?: Property & { property_media?: { file_path: string }[] } | null;
    customer?: Profile | null;
}

interface TaskListProps {
  tasks: EnrichedTask[];
  onCall: (target: { customerId: string; customerPhone: string; customerName: string }) => void;
}

export function TaskList({ tasks, onCall }: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<EnrichedTask | null>(null);

  return (
    <>
      <TaskDetailsDialog 
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
      <div className="space-y-4">
        {tasks.map((task) => (
          <Card key={task.id} className={task.status === 'Done' ? 'bg-muted/50' : ''}>
              <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
                  <Checkbox id={`task-${task.id}`} className="mt-1" checked={task.status === 'Done'} />
                  <div className="grid gap-1">
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <CardDescription>
                          {task.due_date && (
                              <span>Due {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}</span>
                          )}
                          {task.status === 'Done' && <Badge variant="secondary" className="ml-2">Completed</Badge>}
                      </CardDescription>
                  </div>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-0">
                  <p className="text-sm text-muted-foreground">
                      {task.description}
                  </p>

                  {task.customer && (
                       <div className="flex items-center gap-4 text-sm border-t pt-4 mt-4">
                          <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span>Customer:</span>
                          </div>
                          <span className="font-medium">{task.customer.first_name} {task.customer.last_name}</span>
                          <span className="text-muted-foreground">{task.customer.phone}</span>
                       </div>
                  )}
                  
                  {task.property && (
                       <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                              <Building2 className="h-4 w-4" />
                              <span>Property:</span>
                          </div>
                          <span className="font-medium">{task.property.title}</span>
                       </div>
                  )}
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                   <Button variant="outline" size="sm" onClick={() => setSelectedTask(task)}>
                      <Info className="mr-2 h-4 w-4" />
                      Details
                  </Button>
                  {task.customer && task.customer.phone && (
                      <Button 
                          size="sm"
                          onClick={() => onCall({ 
                              customerId: task.customer!.id, 
                              customerPhone: task.customer!.phone!, 
                              customerName: `${task.customer!.first_name} ${task.customer!.last_name}`
                          })}
                          disabled={task.status === 'Done'}
                      >
                          <Phone className="mr-2 h-4 w-4" />
                          Call Customer
                      </Button>
                  )}
              </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
