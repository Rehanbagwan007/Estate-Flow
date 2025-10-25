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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { submitJobReport } from './actions';
import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import type { UserRole } from '@/lib/types';

interface JobReportFormProps {
  userRole: UserRole;
  userId: string;
}

const reportSchema = z.object({
  details: z.string().min(10, 'Please provide more details about your work.'),
  travel_distance: z.coerce.number().min(0).optional(),
  site_visits: z.coerce.number().int().min(0).optional(),
});

export function JobReportForm({ userRole, userId }: JobReportFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const isSalesTeam = ['sales_manager', 'sales_executive_1', 'sales_executive_2'].includes(userRole);

  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      details: '',
      travel_distance: 0,
      site_visits: 0,
    },
  });

  function onSubmit(values: z.infer<typeof reportSchema>) {
    startTransition(async () => {
      const result = await submitJobReport(userId, userRole, values);
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success!',
          description: 'Your daily report has been submitted.',
        });
        form.reset();
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Work Details</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Summarize your daily tasks, achievements, and challenges..."
                  rows={5}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isSalesTeam && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="travel_distance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Travel Distance (km)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step="0.1" placeholder="e.g., 50.5" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="site_visits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Visits</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" placeholder="e.g., 3" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Report
          </Button>
        </div>
      </form>
    </Form>
  );
}
