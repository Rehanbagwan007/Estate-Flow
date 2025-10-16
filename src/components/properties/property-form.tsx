'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { propertySchema } from '@/schemas';
import { PROPERTY_STATUSES } from '@/lib/constants';
import type { Property } from '@/lib/types';
import { useFormState } from 'react-dom';
import { saveProperty } from '@/app/(dashboard)/properties/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, X } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import Image from 'next/image';

interface PropertyFormProps {
  property?: Property;
}

const SubmitButton = () => {
  const [isPending, startTransition] = useTransition();
  const { formState } = useFormContext();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Manually trigger validation on click
    formState.trigger();
    if (!formState.isValid) {
      event.preventDefault();
      return;
    }
    // `useFormStatus` can't be used here, so we use a transition
    startTransition(() => {});
  };

  return (
    <Button type="submit" disabled={isPending} onClick={handleClick}>
      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {isPending ? 'Saving...' : 'Save Property'}
    </Button>
  );
};


export function PropertyForm({ property }: PropertyFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof propertySchema>>({
    resolver: zodResolver(propertySchema),
    defaultValues: property || {
      title: '',
      description: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      price: 0,
      bedrooms: 0,
      bathrooms: 0,
      area_sqft: 0,
      status: 'Available',
    },
  });

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
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


  const onSubmit = (values: z.infer<typeof propertySchema>) => {
    startTransition(async () => {
      const formData = new FormData();
      if(property?.id) {
        formData.append('id', property.id);
      }
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      files.forEach(file => {
        formData.append('files', file);
      });

      const result = await saveProperty({ message: '' }, formData);
      if (result?.message) {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
                <CardDescription>
                  Fill in the basic information about the property.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Modern Downtown Loft" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A beautiful and detailed description of the property."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Metropolis" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="CA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="zip_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zip Code</FormLabel>
                        <FormControl>
                          <Input placeholder="90210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Media</CardTitle>
                <CardDescription>Upload images and documents for the property.</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="files"
                  render={({ field }) => (
                  <FormItem>
                    <FormLabel>Images & Documents</FormLabel>
                    <FormControl>
                      <div className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
                        <UploadCloud className="w-8 h-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                        <Input type="file" className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" multiple onChange={handleFileChange} />
                      </div>
                    </FormControl>
                  </FormItem>
                  )}
                 />
                 {previews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                      {previews.map((preview, index) => (
                        <div key={index} className="relative aspect-square">
                           <Image src={preview} alt={`Preview ${index}`} layout="fill" className="object-cover rounded-md" />
                           <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeFile(index)}>
                              <X className="h-4 w-4" />
                           </Button>
                        </div>
                      ))}
                    </div>
                 )}
              </CardContent>
            </Card>

          </div>
          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (USD)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="450000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                    control={form.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bedrooms</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="4" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bathrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bathrooms</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.5" placeholder="3" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="area_sqft"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Area (sqft)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="2500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select property status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PROPERTY_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline">Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {property ? 'Update Property' : 'Create Property'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
