
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { updateSalaryParameters } from './actions';
import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';

const settingsSchema = z.object({
  per_call_rate: z.coerce.number().min(0, 'Rate must be non-negative'),
  per_meeting_rate: z.coerce.number().min(0, 'Rate must be non-negative'),
  per_km_travel_rate: z.coerce.number().min(0, 'Rate must be non-negative'),
  per_follow_up_rate: z.coerce.number().min(0, 'Rate must be non-negative'),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface SalarySettingsFormProps {
  currentSettings: { [key: string]: number };
}

export function SalarySettingsForm({ currentSettings }: SalarySettingsFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      per_call_rate: currentSettings['per_call_rate'] || 0,
      per_meeting_rate: currentSettings['per_meeting_rate'] || 0,
      per_km_travel_rate: currentSettings['per_km_travel_rate'] || 0,
      per_follow_up_rate: currentSettings['per_follow_up_rate'] || 0,
    },
  });

  function onSubmit(values: SettingsFormValues) {
    startTransition(async () => {
      const result = await updateSalaryParameters(values);
      if (result.error) {
        toast({
          title: 'Error updating settings',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Settings Updated',
          description: 'Salary parameters have been saved successfully.',
        });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
        <FormField
          control={form.control}
          name="per_call_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rate per Call</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormDescription>
                Amount (INR) paid for each completed 'Call' task.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="per_meeting_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rate per Meeting</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormDescription>
                Amount (INR) paid for each completed 'Meeting' task.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="per_follow_up_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rate per Follow-up</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormDescription>
                Amount (INR) paid for each completed 'Follow-up' task.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="per_km_travel_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rate per Kilometer Traveled</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormDescription>
                Amount (INR) paid for each kilometer reported in approved site visit reports.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </form>
    </Form>
  );
}
