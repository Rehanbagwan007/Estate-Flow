
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { JobReportStatus } from '@/lib/types';

export async function updateJobReportStatus(reportId: string, status: JobReportStatus): Promise<{success: boolean, error?: string}> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Authentication required' };
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
        return { success: false, error: 'Authorization required' };
    }

    const { error } = await supabase
        .from('job_reports')
        .update({ status: status })
        .eq('id', reportId);

    if (error) {
        console.error("Error updating job report status:", error);
        return { success: false, error: 'Failed to update report status.' };
    }
    
    // Find the user whose report this is to revalidate their performance page
    const { data: report } = await supabase.from('job_reports').select('user_id').eq('id', reportId).single();
    if (report) {
        revalidatePath(`/(dashboard)/admin/users/${report.user_id}/performance`);
    }

    return { success: true };
}
