'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface InterestResult {
  success: boolean;
  message: string;
}

export async function expressInterest(propertyId: string): Promise<InterestResult> {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'You must be logged in to express interest.' };
  }

  // BUG FIX: The correct table name from your schema is "property_interests" (plural).
  const { data: existingInterest, error: existingError } = await supabase
    .from('property_interests')
    .select('id')
    .eq('customer_id', user.id)
    .eq('property_id', propertyId)
    .maybeSingle();

  if (existingError) {
    // This error will no longer occur once the table name is correct.
    console.error('Error checking for existing interest:', existingError);
    return { success: false, message: 'There was a database error. Please try again.' };
  }

  if (existingInterest) {
    return { success: false, message: 'You have already expressed interest in this property.' };
  }

  // BUG FIX: Inserting into the correct table name "property_interests".
  const { error } = await supabase.from('property_interests').insert({
    property_id: propertyId,
    customer_id: user.id,
    status: 'pending', 
    interest_level: 'interested' 
  });

  if (error) {
    console.error('Error creating property interest:', error);
    return { success: false, message: 'Failed to submit your interest. Please try again.' };
  }

  revalidatePath('/dashboard');

  return { success: true, message: 'Your interest has been submitted successfully!' };
}
