'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { leadSchema } from '@/schemas';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createLead } from './actions';
import type { Profile } from '@/lib/types';
import { useLeadStore } from '@/lib/store/lead-store';

interface AddLeadFormProps {
  onSuccess?: () => void;
  teamMembers: Profile[];
}

export function AddLeadForm({ onSuccess, teamMembers }: AddLeadFormProps) {
  const { toast } = useToast();
  const addLeadToStore = useLeadStore((state) => state.addLead);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof leadSchema>>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      status: 'Warm',
      source: 'Manual',
    },
  });

  function onSubmit(values: z.infer<typeof leadSchema>) {
    startTransition(async () => {
      const result = await createLead(values);
      if (result?.error) {
        toast({
          title: 'Failed to Create Lead',
          description: result.error,
          variant: 'destructive',
        });
      } else if (result?.data) {
        toast({
          title: 'Lead Created Successfully',
          description: `${values.first_name} has been added to the leads.`,
        });
        
        // Find the full profile of the assigned user
        const assignedProfile = teamMembers.find(member => member.id === result.data.assigned_to);

        // Add the new lead to the Zustand store
        addLeadToStore({
          ...result.data,
          profile: assignedProfile || null,
        });

        form.reset();
        onSuccess?.();
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="John" disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Doe" disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="name@example.com"
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="tel"
                  placeholder="+91 98765 43210"
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Set status" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="Hot">Hot</SelectItem>
                    <SelectItem value="Warm">Warm</SelectItem>
                    <SelectItem value="Cold">Cold</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Source</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Website" disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
            />
        </div>
        <FormField
            control={form.control}
            name="assigned_to"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Assign To (Optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a team member" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {teamMembers.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                        {member.first_name} {member.last_name} ({member.role})
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
        />
        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Lead
            </Button>
        </div>
      </form>
    </Form>
  );
}
