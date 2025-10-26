import { createClient } from '@/lib/supabase/server';
import { LeadsClient } from './client';
import { redirect } from 'next/navigation';
import type { Profile } from '@/lib/types';

async function getLeads(userId: string, userRole: Profile['role']) {
  const supabase = createClient();
  
  let query = supabase.from('leads').select('*, profile:profiles(*)');

  // Application-level security check
  if (userRole === 'agent' || userRole === 'sales_executive_1' || userRole === 'sales_executive_2') {
    query = query.eq('assigned_to', userId);
  } else if (userRole !== 'super_admin' && userRole !== 'admin' && userRole !== 'sales_manager') {
    // If not a manager/admin, and not an agent, they see nothing.
    return [];
  }
  // Admins/Managers will see all leads by default (no filter)

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching leads:", error.message);
    return [];
  }
  return data;
}

export default async function LeadsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

  if (!profile) {
    return redirect('/login');
  }
  
  const leads = await getLeads(user.id, profile.role);
  return <LeadsClient initialLeads={leads} />;
}
