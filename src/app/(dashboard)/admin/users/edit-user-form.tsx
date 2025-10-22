'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { signupSchema } from '@/schemas';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { updateUserRole } from "@/app/(dashboard)/admin/users/action";
import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Profile } from '@/lib/types';

interface EditUserFormProps {
  user: Profile;
  onSuccess?: () => void;
}

const roleUpdateSchema = z.object({
  role: signupSchema.shape.role,
});

export function EditUserForm({ user, onSuccess }: EditUserFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof roleUpdateSchema>>({
    resolver: zodResolver(roleUpdateSchema),
    defaultValues: {
      role: user.role,
    },
  });

  function onSubmit(values: z.infer<typeof roleUpdateSchema>) {
    startTransition(async () => {
      const result = await updateUserRole(user.id, values.role);
      if (result?.error) {
        toast({
          title: 'Failed to Update Role',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Role Updated Successfully',
          description: result.message,
        });
        onSuccess?.();
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isPending}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="caller_1">Caller 1</SelectItem>
                  <SelectItem value="caller_2">Caller 2</SelectItem>
                  <SelectItem value="sales_manager">Sales Manager</SelectItem>
                  <SelectItem value="sales_executive_1">
                    Sales Executive 1
                  </SelectItem>
                  <SelectItem value="sales_executive_2">
                    Sales Executive 2
                  </SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Role
            </Button>
        </div>
      </form>
    </Form>
  );
}
