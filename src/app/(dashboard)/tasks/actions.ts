'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Task, TaskStatus } from '@/lib/types';
import { taskSchema, reportSchema } from '@/schemas';

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
        const filePath = `${user.id}/${savedTask.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('task_media')
          .upload(filePath, file);

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
        return { error: 'Failed to update task status.' };
    }

    revalidatePath('/(dashboard)/tasks');
    revalidatePath('/dashboard');

    return { success: true, message: `Task status updated to ${status}.` };
}

export async function submitTaskReport(taskId: string, formData: FormData) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Authentication required.' };
  }

  const { data: task } = await supabase.from('tasks').select('id, assigned_to').eq('id', taskId).single();
  if (!task || task.assigned_to !== user.id) {
    return { error: 'You are not authorized to submit a report for this task.' };
  }

  const values = {
    details: formData.get('details'),
    travel_distance: formData.get('travel_distance'),
    site_visit_locations: formData.get('site_visit_locations'),
  };

  const validatedFields = reportSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: 'Invalid form data. ' + JSON.stringify(validatedFields.error.flatten().fieldErrors) };
  }

  const today = new Date().toISOString().split('T')[0];

  const reportPayload = {
    user_id: user.id,
    report_date: today,
    details: validatedFields.data.details,
    travel_distance_km: validatedFields.data.travel_distance,
    site_visit_locations: validatedFields.data.site_visit_locations,
    status: 'submitted' as const,
    related_task_id: taskId,
  };

  const { data: savedReport, error: reportError } = await supabase
    .from('job_reports')
    .insert(reportPayload)
    .select()
    .single();

  if (reportError) {
    console.error('Error submitting task report:', reportError);
    return { error: 'Failed to submit your report. Please try again.' };
  }

  if (!savedReport) {
    return { error: 'Failed to create report entry.' };
  }

  const files = formData.getAll('files') as File[];
  if (files.length > 0 && files[0].size > 0) {
      for (const file of files) {
        const filePath = `${user.id}/job_reports/${savedReport.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('job_report_media')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload Error:', uploadError.message);
          continue; 
        }
        
        const { data: urlData } = supabase.storage
          .from('job_report_media')
          .getPublicUrl(filePath);

        await supabase.from('job_report_media').insert({
          report_id: savedReport.id,
          file_path: urlData.publicUrl,
          file_type: file.type,
        });
      }
    }

  // Mark task as complete after report submission
  await supabase.from('tasks').update({ status: 'Done', updated_at: new Date().toISOString() }).eq('id', taskId);

  revalidatePath('/(dashboard)/tasks');
  revalidatePath('/(dashboard)/job-reports');

  return { success: true };
}
