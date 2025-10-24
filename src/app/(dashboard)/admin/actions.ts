
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Task, PropertyInterest, Profile } from '@/lib/types';
import { notificationService } from '@/lib/notifications/notification-service';

export async function getTeamMembers(roles: string[]) {
  const supabase = createClient();
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

interface AssignLeadResult {
    success: boolean;
    message: string;
    task?: Task | null;
}

export async function assignLead(
    propertyInterestId: string, 
    teamMemberId: string, 
    taskDueDate?: string
): Promise<AssignLeadResult> {
    console.log('--- Starting Lead Assignment Transaction ---');
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error('[AssignLead] Error: No authenticated user found.');
        return { success: false, message: 'Authentication error: You must be logged in.' };
    }
    
    // 1. Fetch the property interest to get customer and property details
    const { data: interest, error: interestError } = await supabase
        .from('property_interests')
        .select(`*, properties:property_id(title, price), profiles:customer_id(first_name, last_name, phone)`)
        .eq('id', propertyInterestId)
        .single();

    if (interestError || !interest) {
        console.error('[AssignLead] Error fetching property interest:', interestError);
        return { success: false, message: 'Could not find the property interest to assign.' };
    }
    
    if (!interest.customer_id) {
         console.error('[AssignLead] Error: Property interest is missing a customer ID.');
        return { success: false, message: 'Cannot assign lead: The property interest is not linked to a customer.' };
    }

    // 2. Create the agent assignment record
    const { data: assignment, error: assignmentError } = await supabase
      .from('agent_assignments')
      .insert({
        property_interest_id: propertyInterestId,
        agent_id: teamMemberId,
        customer_id: interest.customer_id,
        assigned_by: user.id,
        status: 'assigned',
        priority: 'medium',
        assignment_type: 'property_interest',
      })
      .select()
      .single();
  
    if (assignmentError) {
        console.error('[AssignLead] Error creating agent assignment:', assignmentError);
        return { success: false, message: `Failed to create lead assignment: ${assignmentError.message}` };
    }
    console.log('[AssignLead] Successfully created agent assignment:', assignment.id);
    
    // 3. Create the associated task for the agent
    const taskPayload = {
        title: `Follow up with ${interest.profiles.first_name} ${interest.profiles.last_name}`,
        description: `Customer is interested in the property: ${interest.properties.title}. Please contact them.`,
        assigned_to: teamMemberId,
        created_by: user.id,
        status: 'Todo',
        due_date: taskDueDate,
        related_customer_id: interest.customer_id,
        related_property_id: interest.property_id,
    };

    const { data: newTask, error: taskError } = await supabase
        .from('tasks')
        .insert(taskPayload)
        .select()
        .single();
        
    if (taskError) {
        console.error("[AssignLead] CRITICAL: Failed to create task:", taskError);
        // ROLLBACK: Delete the assignment if task creation fails
        console.log(`[AssignLead] Rolling back assignment ${assignment.id}...`);
        await supabase.from('agent_assignments').delete().eq('id', assignment.id);
        
        return { success: false, message: `Failed to create follow-up task, so assignment was cancelled. Error: ${taskError.message}` };
    }
    console.log('[AssignLead] Successfully created task:', newTask.id);

    // 4. Update the original property interest status to 'assigned'
    const { error: updateError } = await supabase
      .from('property_interests')
      .update({ status: 'assigned' })
      .eq('id', propertyInterestId);

    if (updateError) {
        console.warn('[AssignLead] Warning: Failed to update interest status, but assignment and task were created.', updateError);
        // Not rolling back for this, but logging it as a warning.
    }

    // --- NOTIFICATION LOGIC ---
    const { data: agentProfile } = await supabase.from('profiles').select('first_name, last_name, phone').eq('id', teamMemberId).single();
    
    if (agentProfile && interest.profiles?.phone && interest.preferred_meeting_time) {
        // Notify customer
        notificationService.sendPropertyInterestNotification(
            interest.customer_id,
            interest.properties?.title ?? 'the property',
            interest.properties?.price ?? 0,
            `${agentProfile.first_name} ${agentProfile.last_name}`,
            interest.preferred_meeting_time
        );

        // Notify agent
        notificationService.createNotification({
            user_id: teamMemberId,
            type: 'task_assigned',
            title: 'New Customer Assignment',
            message: `You have a new task to follow up with ${interest.profiles.first_name} regarding ${interest.properties.title}.`,
            data: { taskId: newTask?.id, customerName: `${interest.profiles.first_name} ${interest.profiles.last_name}` },
            send_via: 'whatsapp'
        });
    }

    console.log('--- Lead Assignment Transaction Successful ---');

    revalidatePath('/(dashboard)/admin');
    revalidatePath('/(dashboard)/tasks');
    revalidatePath('/(dashboard)/dashboard');

    return { success: true, message: 'Lead has been assigned, task created, and notifications sent.', task: newTask };
}
