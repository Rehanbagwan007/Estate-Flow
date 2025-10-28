
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const settingsSchema = z.object({
  per_call_rate: z.number().min(0),
  per_meeting_rate: z.number().min(0),
  per_km_travel_rate: z.number().min(0),
});

type SalaryParameters = z.infer<typeof settingsSchema>;

export async function getSalaryParameters(): Promise<{ [key: string]: number }> {
    const supabase = createClient();
    const { data, error } = await supabase.from('salary_parameters').select('parameter_name, rate');

    if (error) {
        console.error('Error fetching salary parameters:', error);
        return {};
    }

    return data.reduce((acc, param) => {
        acc[param.parameter_name] = param.rate;
        return acc;
    }, {} as { [key: string]: number });
}


export async function updateSalaryParameters(values: SalaryParameters) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Authentication required.' };
  }
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
    return { error: 'You are not authorized to update settings.' };
  }
  
  const parametersToUpsert = Object.entries(values).map(([key, value]) => ({
      parameter_name: key,
      rate: value,
      set_by: user.id,
  }));

  const { error } = await supabase.from('salary_parameters').upsert(parametersToUpsert, {
      onConflict: 'parameter_name'
  });

  if (error) {
    console.error('Error updating salary parameters:', error);
    return { error: 'Failed to update salary parameters.' };
  }

  revalidatePath('/(dashboard)/admin/settings');

  return { success: true };
}
