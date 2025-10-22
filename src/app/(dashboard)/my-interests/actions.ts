'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { PropertyInterest } from '@/lib/types';

interface InterestResult {
  success: boolean;
  message: string;
  interest?: PropertyInterest | null;
}

export async function deleteInterest(interestId: string) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Authentication required.' };
  }

  // First, verify the interest belongs to the user trying to delete it.
  const { data: interest, error: fetchError } = await supabase
    .from('property_interests')
    .select('id, customer_id')
    .eq('id', interestId)
    .single();

  if (fetchError || !interest) {
    return { error: 'Interest not found.' };
  }

  if (interest.customer_id !== user.id) {
    return { error: 'You are not authorized to delete this interest.' };
  }
  
  // Proceed with deletion
  const { error: deleteError } = await supabase
    .from('property_interests')
    .delete()
    .eq('id', interestId);

  if (deleteError) {
    console.error('Error deleting interest:', deleteError.message);
    return { error: `Failed to delete interest: ${deleteError.message}` };
  }

  revalidatePath('/(dashboard)/my-interests');
  revalidatePath('/(dashboard)/customer-dashboard');

  return { message: 'Interest removed successfully!' };
}
