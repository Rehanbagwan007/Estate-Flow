
'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Task, TaskStatus } from '@/lib/types';
import { taskSchema, reportSchema } from '@/schemas';
import { whatsappService } from '@/lib/notifications/whatsapp';

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
  
  const rawData = Object.fromEntries(formData.entries());
  
  // Handle date separately
  const dueDate = rawData.due_date ? new Date(rawData.due_date as string) : undefined;
  
  const validatedFields = taskSchema.safeParse({
    ...rawData,
    due_date: dueDate,
  });

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
        due_date: validatedFields.data.due_date?.toISOString(),
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

           console.log(filePath)

        if (uploadError) {
          console.error('Upload Error:', uploadError.message);
          // Even if one file fails, we can try to continue with others.
          // In a real-world app, you might want more robust error handling or a transaction.
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

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Authentication required.' };
    }

    // Optional: Add a check to ensure the user is authorized to update this task
    const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('assigned_to, created_by')
        .eq('id', taskId)
        .single();
    
    if (fetchError || !task) {
        return { error: 'Task not found.' };
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

    const canUpdate = 
        task.assigned_to === user.id || 
        task.created_by === user.id ||
        ['super_admin', 'admin', 'sales_manager'].includes(profile?.role || '');

    if (!canUpdate) {
        return { error: 'You are not authorized to update this task.' };
    }

    const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: status, updated_at: new Date().toISOString() })
        .eq('id', taskId);

    if (updateError) {
        console.error('Error updating task status:', updateError);
        return { error: `Failed to update task status. ${updateError.message}` };
    }

    revalidatePath('/(dashboard)/tasks');
    revalidatePath('/dashboard');

    return { success: true, message: `Task status updated to ${status}.` };
}

export async function sendWhatsAppMessage(phone: string, customerName: string): Promise<{success: boolean, error?: string}> {
  if (!phone) {
      return { success: false, error: 'Phone number is missing.' };
  }

  const message = `Hello ${customerName}, this is a follow-up message from EstateFlow CRM. Please let us know if you have any questions.`;

  const success = await whatsappService.sendSimpleMessage(phone, message);
  
  if (success) {
      return { success: true };
  } else {
      return { success: false, error: 'Failed to send WhatsApp message.' };
  }
}
