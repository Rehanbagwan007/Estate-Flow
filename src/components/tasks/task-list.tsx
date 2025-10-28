
'use client';

import type { Task, Property, Profile, TaskMedia } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../ui/button';
import { Building2, Phone, User, Info, MessageSquare, Loader2, ListTodo } from 'lucide-react';
import { Badge } from '../ui/badge';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getInitials } from '@/lib/utils';
import { useTransition } from 'react';
import { sendWhatsAppMessage } from '@/app/(dashboard)/tasks/actions';
import { useToast } from '@/hooks/use-toast';


interface EnrichedTask extends Task {
    property?: (Property & { property_media?: { file_path: string }[] }) | null;
    customer?: Profile | null;
    task_media?: TaskMedia[] | null;
    assigned_to_profile?: Profile | null;
}

interface TaskListProps {
  tasks: EnrichedTask[];
  onCall: (target: { customerId: string; customerPhone: string; customerName: string }) => void;
  onTaskSelect: (task: EnrichedTask) => void;
}

export function TaskList({ tasks, onCall, onTaskSelect }: TaskListProps) {
  const [isSendingWhatsApp, startWhatsAppTransition] = useTransition();
  const { toast } = useToast();

  const handleWhatsAppClick = (e: React.MouseEvent, task: EnrichedTask) => {
    e.stopPropagation(); // Prevent card click
    const customerName = task.customer ? `${task.customer.first_name} ${task.customer.last_name}` : 'the customer';
    const effectiveCustomerPhone = task.customer?.phone || task.customer_phone;
    if (!effectiveCustomerPhone) {
      toast({ title: 'Error', description: 'Customer phone number is not available.', variant: 'destructive' });
      return;
    }
    startWhatsAppTransition(async () => {
        const result = await sendWhatsAppMessage(effectiveCustomerPhone, customerName);
        if (result.success) {
            toast({ title: 'Success', description: 'WhatsApp message sent.' });
        } else {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        }
    });
  }

  return (
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <ListTodo className="mx-auto h-12 w-12 opacity-50 mb-4" />
            <p>No tasks found for the selected filters.</p>
          </div>
        ) : tasks.map((task) => {
          const customerName = task.customer ? `${task.customer.first_name} ${task.customer.last_name}` : 'the customer';
          const effectiveCustomerPhone = task.customer?.phone || task.customer_phone;
          const isActionable = task.task_type === 'Call' || task.task_type === 'Follow-up';
          
          return (
          <Card key={task.id} className={task.status === 'Done' ? 'bg-muted/50' : ''}>
              <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
                  <div className="grid gap-1 flex-1">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span onClick={() => onTaskSelect(task)} className="cursor-pointer hover:underline">{task.title}</span>
                        <Badge variant="outline">{task.task_type}</Badge>
                      </CardTitle>
                      <CardDescription>
                          {task.due_date && (
                              <span>Due {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}</span>
                          )}
                          {task.status === 'Done' && <Badge variant="secondary" className="ml-2">Completed</Badge>}
                          {task.status === 'InProgress' && <Badge variant="default" className="ml-2">In Progress</Badge>}
                      </CardDescription>
                  </div>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-0">
                  <p className="text-sm text-muted-foreground">
                      {task.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm border-t pt-4 mt-4">
                    {task.assigned_to_profile && (
                        <div className="flex items-center gap-2" title="Assigned To">
                           <Avatar className="h-6 w-6">
                             <AvatarImage src={`https://i.pravatar.cc/150?u=${task.assigned_to}`} />
                             <AvatarFallback>{getInitials(task.assigned_to_profile?.first_name, task.assigned_to_profile?.last_name)}</AvatarFallback>
                           </Avatar>
                           <span className="font-medium">{task.assigned_to_profile.first_name} {task.assigned_to_profile.last_name}</span>
                        </div>
                    )}
                    {(task.customer || effectiveCustomerPhone) && (
                       <div className="flex items-center gap-2 text-muted-foreground" title="Customer">
                          <User className="h-4 w-4" />
                          <span className="font-medium text-foreground">{customerName}</span>
                          <span>{effectiveCustomerPhone}</span>
                       </div>
                    )}
                    {task.property && (
                         <div className="flex items-center gap-2 text-muted-foreground" title="Related Property">
                            <Building2 className="h-4 w-4" />
                            <span className="font-medium text-foreground">{task.property.title}</span>
                         </div>
                    )}
                  </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                   <Button variant="outline" size="sm" onClick={() => onTaskSelect(task)}>
                      <Info className="mr-2 h-4 w-4" />
                      Details
                  </Button>
                  {isActionable && effectiveCustomerPhone && (
                    <>
                      <Button 
                          variant="secondary"
                          size="sm"
                          onClick={(e) => handleWhatsAppClick(e, task)}
                          disabled={task.status === 'Done' || isSendingWhatsApp}
                      >
                           {isSendingWhatsApp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                          WhatsApp
                      </Button>
                      <Button 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCall({ 
                                customerId: task.customer?.id || 'unknown', 
                                customerPhone: effectiveCustomerPhone, 
                                customerName: customerName
                            })
                          }}
                          disabled={task.status === 'Done'}
                      >
                          <Phone className="mr-2 h-4 w-4" />
                          Call
                      </Button>
                    </>
                  )}
              </CardFooter>
          </Card>
        )})}
      </div>
  );
}
