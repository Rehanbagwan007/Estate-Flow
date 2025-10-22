'use client';

import { useState, useEffect, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getTeamMembers, assignAgentToInterest } from '@/app/(dashboard)/admin/actions';
import type { PropertyInterest, Profile, Property } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface EnrichedInterest extends PropertyInterest {
    property: Property | null;
    customer: Profile | null;
}
  
interface AssignAgentDialogProps {
  interest: EnrichedInterest | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (interestId: string) => void;
}

const ASSIGNABLE_ROLES = ['agent', 'sales_executive_1', 'sales_executive_2', 'caller_1', 'caller_2'];

export function AssignAgentDialog({ interest, isOpen, onClose, onSuccess }: AssignAgentDialogProps) {
  const [agents, setAgents] = useState<Profile[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [isFetchingAgents, setIsFetchingAgents] = useState(false);
  const [isAssigning, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setIsFetchingAgents(true);
      getTeamMembers(ASSIGNABLE_ROLES)
        .then(setAgents)
        .finally(() => setIsFetchingAgents(false));
    }
  }, [isOpen]);

  const handleAssign = () => {
    if (!selectedAgent || !interest) return;

    startTransition(async () => {
      const result = await assignAgentToInterest(interest.id, selectedAgent);
      if (result.success) {
        toast({
          title: 'Success!',
          description: result.message,
        });
        onSuccess(interest.id);
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
          <DialogTitle>Assign Agent</DialogTitle>
          <DialogDescription>
            Assign an agent to the property interest for: <span className="font-semibold">{interest.property?.title}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Customer</Label>
                <p className="text-sm font-medium">{interest.customer?.first_name} {interest.customer?.last_name}</p>
                <p className="text-sm text-muted-foreground">{interest.customer?.email}</p>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isAssigning}>Cancel</Button>
          <Button onClick={handleAssign} disabled={!selectedAgent || isAssigning}>
            {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
