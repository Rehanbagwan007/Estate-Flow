import { createClient } from '@/lib/supabase/server';
import { PropertiesClient } from './client';

async function getProperties() {
  const supabase = createClient();
  const { data, error } = await (await supabase).from('properties').select('*').order('created_at', { ascending: false });
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
