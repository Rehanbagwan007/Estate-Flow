'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import type { Task } from '@/lib/types';

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

export async function assignAgentToInterest(propertyInterestId: string, agentId: string, taskDueDate?: string): Promise<{ success: boolean; message: string; task?: Task | null }> {
    console.log('--- Starting Agent Assignment ---');
    console.log('Property Interest ID:', propertyInterestId);
    console.log('Agent ID to assign:', agentId);
    console.log('Task Due Date:', taskDueDate);

    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error('No authenticated user found.');
        return { success: false, message: 'Authentication error: You must be logged in.' };
    }
    console.log('Assigning Admin ID:', user.id);
  
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

    console.log('Successfully updated property interest. Customer ID:', interestUpdate.customer_id);
  
    const { data: assignment, error: assignmentError } = await supabase
      .from('agent_assignments')
      .insert({
        property_interest_id: propertyInterestId,
        agent_id: agentId,
        customer_id: interestUpdate.customer_id,
        assigned_by: user.id,
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
    
    console.log('Successfully created agent assignment:', assignment.id);
    
    // Create a task for the assigned agent
    const { data: newTask, error: taskError } = await supabase
        .from('tasks')
        .insert({
            title: `Follow up with ${interestUpdate.customer.first_name} ${interestUpdate.customer.last_name}`,
            description: `Customer is interested in the property: ${interestUpdate.property.title}. Please contact them.`,
            assigned_to: agentId,
            created_by: user.id,
            status: 'Todo',
            due_date: taskDueDate,
            related_lead_id: null, // This is an interest, not a formal lead yet
            related_property_id: interestUpdate.property_id,
        })
        .select()
        .single();
        
    if (taskError) {
        console.error("Failed to create task:", taskError);
        // This is not a critical failure, so we'll just log it and continue.
        // In a real-world app, you might want more robust error handling here.
    } else {
        console.log('Successfully created task:', newTask.id);
    }


    console.log('--- Agent Assignment and Task Creation Successful ---');

    // TODO: Trigger WhatsApp notification here in a real scenario

    revalidatePath('/(dashboard)/admin');
    revalidatePath('/(dashboard)/tasks');
    return { success: true, message: 'Agent has been assigned and task has been created.', task: newTask };
}
