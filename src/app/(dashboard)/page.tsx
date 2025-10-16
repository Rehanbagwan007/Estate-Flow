import { DashboardClient } from './client';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

async function getDashboardData() {
  const supabase = createClient();
   const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const propertiesPromise = supabase.from('properties').select('*').order('created_at', { ascending: false });
  const leadsPromise = supabase.from('leads').select('*, profile:profiles(*)').order('created_at', { ascending: false });
  
  const [propertiesResult, leadsResult] = await Promise.all([propertiesPromise, leadsPromise]);

  if (propertiesResult.error) console.error('Error fetching properties:', propertiesResult.error.message);
  if (leadsResult.error) console.error('Error fetching leads:', leadsResult.error.message);

  const properties = propertiesResult.data ?? [];
  const leads = leadsResult.data ?? [];

  return { properties, leads };
}

export default async function DashboardPage() {
  const { properties, leads } = await getDashboardData();
  
  return <DashboardClient properties={properties} leads={leads} />;
}
