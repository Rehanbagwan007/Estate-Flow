'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { leadSchema } from '@/schemas';
import type { Lead, Profile } from '@/lib/types';

type LeadWithProfile = Lead & { profile: Profile | null };

export async function createLead(values: z.infer<typeof leadSchema>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to create a lead.' };
  }
  
  const { data, error } = await supabase
    .from('leads')
    .insert({
      ...values,
      created_by: user.id,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating lead:', error);
    return { error: `Failed to create lead: ${error.message}` };
  }
  
  // We revalidate the path to ensure the server-fetched list is up-to-date
  revalidatePath('/(dashboard)/leads');

  return { data };
}
