'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function getTeamMembers(roles: string[]) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role')
    .in('role', roles);

  if (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
  return data;
}

export async function assignAgentToInterest(propertyInterestId: string, agentId: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
  
    const { data: interestUpdate, error: updateError } = await supabase
      .from('property_interests')
      .update({ status: 'assigned' })
      .eq('id', propertyInterestId)
      .select(`
        *,
        property:properties(title),
        customer:profiles(first_name, last_name, phone)
      `)
      .single();

    if (updateError || !interestUpdate) {
        console.error("Failed to update interest status:", updateError);
        return { success: false, message: 'Failed to update interest status.' };
    }
  
    const { data: assignment, error: assignmentError } = await supabase
      .from('agent_assignments')
      .insert({
        property_interest_id: propertyInterestId,
        agent_id: agentId,
        customer_id: interestUpdate.customer_id,
        assigned_by: interestUpdate.customer_id, // This should be admin's ID, but for now user's.
        status: 'assigned',
        priority: 'medium',
        assignment_type: 'property_interest',
      })
      .select()
      .single();
  
    if (assignmentError) {
        console.error("Failed to create assignment:", assignmentError);
        // Optionally revert the status update
        await supabase.from('property_interests').update({ status: 'pending' }).eq('id', propertyInterestId);
        return { success: false, message: 'Failed to create agent assignment.' };
    }

    // TODO: Trigger WhatsApp notification here in a real scenario

    revalidatePath('/(dashboard)/admin');
    return { success: true, message: 'Agent has been assigned successfully.' };
}
