'use client';

import { useState, useEffect, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getTeamMembers, assignAgentToInterest } from '@/app/(dashboard)/admin/actions';
import type { PropertyInterest, Profile, Property, Task } from '@/lib/types';
import { Loader2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EnrichedInterest extends PropertyInterest {
    properties: Property | null;
    profiles: Profile | null;
}
  
interface AssignAgentDialogProps {
  interest: EnrichedInterest | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (interestId: string, assignedTask: Task) => void;
}

const ASSIGNABLE_ROLES = ['admin', 'agent', 'caller_1', 'caller_2', 'sales_manager', 'sales_executive_1', 'sales_executive_2'];

export function AssignAgentDialog({ interest, isOpen, onClose, onSuccess }: AssignAgentDialogProps) {
  const [agents, setAgents] = useState<Profile[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [taskDueDate, setTaskDueDate] = useState<Date | undefined>();
  const [taskDueTime, setTaskDueTime] = useState<string>('');
  
  const [isFetchingAgents, setIsFetchingAgents] = useState(false);
  const [isAssigning, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setIsFetchingAgents(true);
      getTeamMembers(ASSIGNABLE_ROLES)
        .then(setAgents)
        .finally(() => setIsFetchingAgents(false));
      
      // Pre-fill with customer's preferred time if available
      if (interest?.preferred_meeting_time) {
        const preferredDate = new Date(interest.preferred_meeting_time);
        setTaskDueDate(preferredDate);
        setTaskDueTime(`${String(preferredDate.getHours()).padStart(2, '0')}:${String(preferredDate.getMinutes()).padStart(2, '0')}`);
      } else {
        setTaskDueDate(undefined);
        setTaskDueTime('');
      }

    }
  }, [isOpen, interest]);

  const handleAssign = () => {
    if (!selectedAgent || !interest) return;

    let finalDueDate: Date | undefined = undefined;
    if (taskDueDate && taskDueTime) {
        finalDueDate = new Date(taskDueDate);
        const [hours, minutes] = taskDueTime.split(':');
        finalDueDate.setHours(parseInt(hours, 10));
        finalDueDate.setMinutes(parseInt(minutes, 10));
    }

    startTransition(async () => {
      const result = await assignAgentToInterest(interest.id, selectedAgent, finalDueDate?.toISOString());
      if (result.success && result.task) {
        toast({
          title: 'Success!',
          description: result.message,
        });
        onSuccess(interest.id, result.task);
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    });
  };

  if (!interest) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Agent & Create Task</DialogTitle>
          <DialogDescription>
            Assign a team member to follow up on the interest for: <span className="font-semibold">{interest.properties?.title}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Customer</Label>
                <p className="text-sm font-medium">{interest.profiles?.first_name} {interest.profiles?.last_name}</p>
                <p className="text-sm text-muted-foreground">{interest.profiles?.email}</p>
                {interest.preferred_meeting_time && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Customer prefers: {new Date(interest.preferred_meeting_time).toLocaleString()}
                    </p>
                )}
            </div>
          <div className="space-y-2">
            <Label htmlFor="agent">Select Agent</Label>
            {isFetchingAgents ? <p>Loading agents...</p> : (
              <Select onValueChange={setSelectedAgent} value={selectedAgent}>
                <SelectTrigger id="agent">
                  <SelectValue placeholder="Select an agent to assign" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.first_name} {agent.last_name} ({agent.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label>Set Task Due Date & Time</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !taskDueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {taskDueDate ? format(taskDueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={taskDueDate}
                    onSelect={setTaskDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
               <Select onValueChange={setTaskDueTime} value={taskDueTime}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="09:00">9:00 AM</SelectItem>
                  <SelectItem value="11:00">11:00 AM</SelectItem>
                  <SelectItem value="14:00">2:00 PM</SelectItem>
                  <SelectItem value="16:00">4:00 PM</SelectItem>
                  <SelectItem value="18:00">6:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isAssigning}>Cancel</Button>
          <Button onClick={handleAssign} disabled={!selectedAgent || isAssigning}>
            {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
