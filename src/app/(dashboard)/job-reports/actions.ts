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

export async function submitJobReport(userId: string, userRole: UserRole, formData: FormData) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
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

  // 1. Find who the user reports to
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

  // 2. Check if a report for today already exists
  const today = new Date().toISOString().split('T')[0];
  const { data: existingReport } = await supabase
    .from('job_reports')
    .select('id')
    .eq('user_id', userId)
    .eq('report_date', today)
    .maybeSingle();

  if (existingReport) {
    return { error: 'You have already submitted a report for today. You can edit it from the reports page.' };
  }

  // 3. Insert the new report
  const reportPayload = {
    user_id: userId,
    report_to: reportToId,
    report_date: today,
    details: validatedFields.data.details,
    travel_distance_km: validatedFields.data.travel_distance,
    site_visit_locations: validatedFields.data.site_visit_locations,
    status: 'submitted' as const,
  };

  const { data: savedReport, error: reportError } = await supabase
    .from('job_reports')
    .insert(reportPayload)
    .select()
    .single();

  if (reportError) {
    console.error('Error submitting job report:', reportError);
    return { error: 'Failed to submit your report. Please try again.' };
  }

  if (!savedReport) {
    return { error: 'Failed to create report entry.' };
  }

  // 4. Handle file uploads
  const files = formData.getAll('files') as File[];
  if (files.length > 0 && files[0].size > 0) {
      for (const file of files) {
        const filePath = `${user.id}/job_reports/${savedReport.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('job_report_media')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload Error:', uploadError.message);
          continue; // Skip failed uploads but continue with others
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


  revalidatePath('/(dashboard)/job-reports');
  revalidatePath('/dashboard');

  return { success: true };
}
