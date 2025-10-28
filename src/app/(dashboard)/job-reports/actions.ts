
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { UserRole } from '@/lib/types';
import { z } from 'zod';

const reportSchema = z.object({
  details: z.string().min(10),
  travel_distance: z.coerce.number().min(0).optional(),
  site_visit_locations: z.string().optional(),
});

export async function submitJobReport(
  userId: string, 
  userRole: UserRole, 
  formData: FormData,
  relatedTaskId?: string,
  taskTitle?: string
) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return { error: 'Authentication required.' };
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

  // Check if a report for today already exists
  const today = new Date().toISOString().split('T')[0];
  const { data: existingReport } = await supabase
    .from('job_reports')
    .select('*')
    .eq('user_id', userId)
    .eq('report_date', today)
    .maybeSingle();

  let finalReportDetails = validatedFields.data.details;
  if (taskTitle) {
    finalReportDetails = `Report for task "${taskTitle}":\n${validatedFields.data.details}`;
  }

  let savedReportId: string;

  if (existingReport) {
    // Update existing report
    const updatedDetails = `${existingReport.details}\n\n---\n\n${finalReportDetails}`;
    const updatedTravel = (existingReport.travel_distance_km || 0) + (validatedFields.data.travel_distance || 0);
    const updatedLocations = [existingReport.site_visit_locations, validatedFields.data.site_visit_locations]
      .filter(Boolean)
      .join(', ');

    const { data: updatedReport, error: updateError } = await supabase
      .from('job_reports')
      .update({
        details: updatedDetails,
        travel_distance_km: updatedTravel,
        site_visit_locations: updatedLocations,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingReport.id)
      .select('id')
      .single();
    
    if (updateError) {
      console.error('Error updating job report:', updateError);
      return { error: 'Failed to update your report.' };
    }
    savedReportId = updatedReport.id;

  } else {
    // Insert new report
    let reportToId: string | null = null;
    if (userRole === 'admin') {
      const { data: superAdmin } = await supabase.from('profiles').select('id').eq('role', 'super_admin').limit(1).single();
      if (superAdmin) reportToId = superAdmin.id;
    } else if (userRole !== 'super_admin') {
      const { data: admin } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
      if (admin) reportToId = admin.id;
    }

    if (!reportToId && userRole !== 'super_admin') {
      return { error: 'Could not find a user to report to. Please contact system administrator.' };
    }

    const reportPayload = {
      user_id: userId,
      report_to: reportToId,
      report_date: today,
      details: finalReportDetails,
      travel_distance_km: validatedFields.data.travel_distance,
      site_visit_locations: validatedFields.data.site_visit_locations,
      status: 'submitted' as const,
      related_task_id: relatedTaskId,
    };

    const { data: newReport, error: reportError } = await supabase
      .from('job_reports')
      .insert(reportPayload)
      .select('id')
      .single();

    if (reportError) {
      console.error('Error submitting job report:', reportError);
      return { error: `Failed to submit your report. Error: ${reportError.message}` };
    }
    savedReportId = newReport.id;
  }

  // Handle file uploads for the report entry (new or existing)
  const files = formData.getAll('files') as File[];
  if (files.length > 0 && files[0].size > 0) {
      for (const file of files) {
        const filePath = `${user.id}/job_reports/${savedReportId}/${Date.now()}-${file.name}`;
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
          report_id: savedReportId,
          file_path: urlData.publicUrl,
          file_type: file.type,
        });
      }
    }

  // If the report was related to a task, mark the task as complete
  if (relatedTaskId) {
    await supabase.from('tasks').update({ status: 'Done', updated_at: new Date().toISOString() }).eq('id', relatedTaskId);
  }

  revalidatePath('/(dashboard)/job-reports');
  revalidatePath('/(dashboard)/tasks');
  revalidatePath('/dashboard');

  return { success: true, message: 'Report submitted successfully!' };
}
