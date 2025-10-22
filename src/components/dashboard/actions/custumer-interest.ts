'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { PropertyInterest } from '@/lib/types';
import { cookies } from 'next/headers';

interface InterestResult {
  success: boolean;
  message: string;
  interest?: PropertyInterest | null;
}

export async function expressInterest(propertyId: string): Promise<InterestResult> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'You must be logged in to express interest.' };
  }

  const { data: existingInterest, error: existingError } = await supabase
    .from('property_interests')
    .select('id')
    .eq('customer_id', user.id)
    .eq('property_id', propertyId)
    .maybeSingle();

  if (existingError) {
    console.error('Error checking for existing interest:', existingError);
    return { success: false, message: 'There was a database error. Please try again.' };
  }

  if (existingInterest) {
    return { success: false, message: 'You have already expressed interest in this property.' };
  }

  const { data, error } = await supabase.from('property_interests').insert({
    property_id: propertyId,
    customer_id: user.id,
    status: 'pending', 
    interest_level: 'interested' 
  }).select('*, property:properties(*)').single();

  if (error) {
    console.error('Error creating property interest:', error);
    return { success: false, message: 'Failed to submit your interest. Please try again.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/my-interests');

  return { success: true, message: 'Your interest has been submitted successfully!', interest: data };
}
