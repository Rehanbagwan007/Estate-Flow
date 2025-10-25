'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { UserRole } from '@/lib/types';
import { z } from 'zod';

const reportSchema = z.object({
  details: z.string().min(10),
  travel_distance: z.coerce.number().min(0).optional(),
  site_visits: z.coerce.number().int().min(0).optional(),
});

export async function submitJobReport(userId: string, userRole: UserRole, values: z.infer<typeof reportSchema>) {
  const supabase = createClient();

  // 1. Find who the user reports to
  let reportToId: string | null = null;
  if (userRole === 'admin') {
    // Admin reports to Super Admin
    const { data: superAdmin } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'super_admin')
      .limit(1)
      .single();
    if (superAdmin) {
      reportToId = superAdmin.id;
    }
  } else if (userRole !== 'super_admin') {
    // Other employees report to Admin
    const { data: admin } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single();
    if (admin) {
      reportToId = admin.id;
    }
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
    details: values.details,
    travel_distance_km: values.travel_distance,
    site_visits: values.site_visits,
    status: 'submitted',
  };

  const { error } = await supabase.from('job_reports').insert(reportPayload);

  if (error) {
    console.error('Error submitting job report:', error);
    return { error: 'Failed to submit your report. Please try again.' };
  }

  revalidatePath('/(dashboard)/job-reports');
  revalidatePath('/dashboard');

  return { success: true };
}
