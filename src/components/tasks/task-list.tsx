
'use client';

import type { Task, Property, Profile, TaskMedia } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Building2, Phone, User, Info, MapPin } from 'lucide-react';
import { Badge } from '../ui/badge';
import Image from 'next/image';

interface EnrichedTask extends Task {
    property?: (Property & { property_media?: { file_path: string }[] }) | null;
    customer?: Profile | null;
    task_media?: TaskMedia[] | null;
}

interface TaskListProps {
  tasks: EnrichedTask[];
  onCall: (target: { customerId: string; customerPhone: string; customerName: string }) => void;
  onTaskSelect: (task: EnrichedTask) => void;
}

export function TaskList({ tasks, onCall, onTaskSelect }: TaskListProps) {
  return (
      <div className="space-y-4">
        {tasks.map((task) => {
          const customerName = task.customer ? `${task.customer.first_name} ${task.customer.last_name}` : 'the customer';
          const effectiveCustomerPhone = task.customer?.phone || task.customer_phone;
          
          return (
          <Card key={task.id} className={task.status === 'Done' ? 'bg-muted/50' : ''}>
              <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
                  <Checkbox id={`task-${task.id}`} className="mt-1" checked={task.status === 'Done'} />
                  <div className="grid gap-1 flex-1">
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

                  {(task.customer || effectiveCustomerPhone) && (
                       <div className="flex items-center gap-4 text-sm border-t pt-4 mt-4">
                          <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span>Customer:</span>
                          </div>
                          <span className="font-medium">{customerName}</span>
                          <span className="text-muted-foreground">{effectiveCustomerPhone}</span>
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

                  {task.location_address && (
                     <a href={task.location_address} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-500 hover:underline">
                        <MapPin className="h-4 w-4" />
                        <span>View Location</span>
                    </a>
                  )}

                 {task.task_media && task.task_media.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Attachments</p>
                        <div className="flex gap-2">
                            {task.task_media.map((media, index) => (
                                <div key={index} className="relative h-16 w-16 rounded-md overflow-hidden">
                                    <Image src={media.file_path} alt={`Task media ${index + 1}`} fill className="object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                   <Button variant="outline" size="sm" onClick={() => onTaskSelect(task)}>
                      <Info className="mr-2 h-4 w-4" />
                      Details
                  </Button>
                  {task.task_type === 'Call' && effectiveCustomerPhone && (
                      <Button 
                          size="sm"
                          onClick={() => onCall({ 
                              customerId: task.customer?.id || 'unknown', 
                              customerPhone: effectiveCustomerPhone, 
                              customerName: customerName
                          })}
                          disabled={task.status === 'Done'}
                      >
                          <Phone className="mr-2 h-4 w-4" />
                          Call Customer
                      </Button>
                  )}
              </CardFooter>
          </Card>
        )})}
      </div>
  );
}

    