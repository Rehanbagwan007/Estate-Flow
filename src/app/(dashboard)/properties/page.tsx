import { createClient } from '@/lib/supabase/server';
import { PropertiesClient } from './client';
import { cookies } from 'next/headers';

async function getProperties() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching properties:', error);
    return [];
  }
  return data;
}

export default async function PropertiesPage() {
  const properties = await getProperties();
  return <PropertiesClient initialProperties={properties} />;
}
