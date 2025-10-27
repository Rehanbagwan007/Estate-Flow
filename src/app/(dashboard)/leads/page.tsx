import { createClient } from '@/lib/supabase/server';
import { LeadsClient } from './client';
import { redirect } from 'next/navigation';
import type { Profile } from '@/lib/types';

async function getLeads(userId: string, userRole: Profile['role']) {
  const supabase = createClient();
  
  let query = supabase.from('leads').select('*, profile:profiles(*)');

  // RLS will handle security, but this provides a client-side performance optimization.
  if (userRole === 'agent' || userRole === 'sales_executive_1' || userRole === 'sales_executive_2') {
    query = query.eq('assigned_to', userId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching leads:", error.message);
    return [];
  }
  return data;
}

async function getTeamMembers(): Promise<Profile[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('profiles').select('id, first_name, last_name, role');
    if (error) {
        console.error("Error fetching team members:", error);
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
  const teamMembers = await getTeamMembers();

  return <LeadsClient initialLeads={leads} teamMembers={teamMembers} />;
}
