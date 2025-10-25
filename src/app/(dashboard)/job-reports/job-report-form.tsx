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
import { useState, useTransition } from 'react';
import { Loader2, UploadCloud, X } from 'lucide-react';
import type { UserRole } from '@/lib/types';
import Image from 'next/image';

interface JobReportFormProps {
  userRole: UserRole;
  userId: string;
}

const reportSchema = z.object({
  details: z.string().min(10, 'Please provide more details about your work.'),
  travel_distance: z.coerce.number().min(0).optional(),
  site_visit_locations: z.string().optional(),
  files: z.any().optional(),
});

export function JobReportForm({ userRole, userId }: JobReportFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      details: '',
      travel_distance: 0,
      site_visit_locations: '',
    },
  });
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
      
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };


  function onSubmit(values: z.infer<typeof reportSchema>) {
    startTransition(async () => {
      const formData = new FormData();
      
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            formData.append(key, String(value));
        }
      });

      files.forEach(file => {
        formData.append('files', file);
      });

      const result = await submitJobReport(userId, userRole, formData);
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
        setFiles([]);
        setPreviews([]);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

        <>
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
            name="site_visit_locations"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Site Visit Locations</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="List the places you visited, e.g., 'Client Office, Bandra', 'Project Site, Andheri'"
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="files"
            render={() => (
            <FormItem>
              <FormLabel>Upload Visit Photos</FormLabel>
              <FormControl>
                <div className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
                  <UploadCloud className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload photos</p>
                  <Input type="file" className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" multiple onChange={handleFileChange} accept="image/*" />
                </div>
              </FormControl>
            </FormItem>
            )}
            />
            {previews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative aspect-square">
                      <Image src={preview} alt={`Preview ${index}`} fill className="object-cover rounded-md" />
                      <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeFile(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                  </div>
                ))}
              </div>
            )}
        </>

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
