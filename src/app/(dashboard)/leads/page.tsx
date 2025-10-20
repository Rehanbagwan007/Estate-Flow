import { createClient } from '@/lib/supabase/server';
import { LeadsClient } from './client';

async function getLeads() {
  const supabase = createClient();
  const { data, error } = await (await supabase).from('leads').select('*, profile:profiles(*)');

  if (error) {
    console.error("Error fetching leads:", error.message);
    return [];
  }
  return data;
}

export default async function LeadsPage() {
  const leads = await getLeads();
  return <LeadsClient initialLeads={leads} />;
}
