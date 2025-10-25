'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Task } from '@/lib/types';

const taskSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    assigned_to: z.string().uuid(),
    due_date: z.string().optional(),
    location_address: z.string().optional(),
});

export async function createTask(
  prevState: { message: string; success?: boolean },
  formData: FormData
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { message: 'Authentication required.' };
  }
  
  const validatedFields = taskSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      message: 'Invalid form data. ' + JSON.stringify(validatedFields.error.flatten().fieldErrors),
    };
  }

  const files = formData.getAll('files') as File[];
  
  let savedTask: Task | null = null;

  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...validatedFields.data,
        created_by: user.id,
        status: 'Todo',
      })
      .select()
      .single();
    if (error) throw error;
    savedTask = data;

    if (!savedTask) {
      throw new Error('Failed to create the task.');
    }
    
    // Handle file uploads
    if (files.length > 0 && files[0].size > 0) {
      for (const file of files) {
        const filePath = `${user.id}/task_media/${savedTask.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('task_media')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload Error:', uploadError.message);
          continue;
        }
        
        const { data: urlData } = supabase.storage
          .from('task_media')
          .getPublicUrl(filePath);

        await supabase.from('task_media').insert({
          task_id: savedTask.id,
          file_path: urlData.publicUrl,
          file_type: file.type,
        });
      }
    }

  } catch (error) {
    console.error(error);
    let message = 'An unknown error occurred';
    if (error instanceof Error) {
      message = error.message;
    }
    return { message: `Database Error: ${message}` };
  }

  revalidatePath('/(dashboard)/tasks');
  revalidatePath('/dashboard');
  
  return {
    success: true,
    message: 'Task created and assigned successfully!',
  };
}
