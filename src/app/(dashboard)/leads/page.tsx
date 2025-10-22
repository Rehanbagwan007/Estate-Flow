import { createClient } from '@/lib/supabase/server';
import { LeadsClient } from './client';
import { cookies } from 'next/headers';

async function getLeads() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.from('leads').select('*, profile:profiles(*)');

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
