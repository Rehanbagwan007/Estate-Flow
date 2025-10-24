
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Task } from '@/lib/types';
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

export async function assignLead(propertyInterestId: string, teamMemberId: string, taskDueDate?: string): Promise<{ success: boolean; message: string; task?: Task | null }> {
    console.log('--- Starting Lead Assignment ---');
    console.log('Property Interest ID:', propertyInterestId);
    console.log('Team Member ID to assign:', teamMemberId);
    console.log('Task Due Date:', taskDueDate);

    const supabase = createClient();

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
        properties:property_id(title, price),
        profiles:customer_id(first_name, last_name, phone)
      `)
      .single();

    if (updateError || !interestUpdate) {
        console.error("Failed to update interest status:", updateError);
        return { success: false, message: `Failed to update interest status: ${updateError?.message}` };
    }

    console.log('Successfully updated property interest. Customer ID:', interestUpdate.customer_id);
  
    const { data: assignment, error: assignmentError } = await supabase
      .from('agent_assignments')
      .insert({
        property_interest_id: propertyInterestId,
        agent_id: teamMemberId,
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
        await supabase.from('property_interests').update({ status: 'pending' }).eq('id', propertyInterestId);
        return { success: false, message: `Failed to create lead assignment: ${assignmentError.message}` };
    }
    
    console.log('Successfully created lead assignment:', assignment.id);
    
    const taskPayload = {
        title: `Follow up with ${interestUpdate.profiles.first_name} ${interestUpdate.profiles.last_name}`,
        description: `Customer is interested in the property: ${interestUpdate.properties.title}. Please contact them.`,
        assigned_to: teamMemberId,
        created_by: user.id,
        status: 'Todo',
        due_date: taskDueDate,
        related_customer_id: interestUpdate.customer_id,
        related_property_id: interestUpdate.property_id,
        related_assignment_id: assignment.id,
    };

    const { data: newTask, error: taskError } = await supabase
        .from('tasks')
        .insert(taskPayload)
        .select()
        .single();
        
    if (taskError) {
        console.error("Failed to create task:", taskError);
        // Even if task fails, we don't rollback the whole assignment for now
        // but we return an error message about the task creation.
        return { success: false, message: `Lead assigned, but failed to create task: ${taskError.message}` };
    }
    
    console.log('Successfully created task:', newTask.id);


    // --- NOTIFICATION LOGIC ---
    const { data: agentProfile } = await supabase.from('profiles').select('first_name, last_name, phone').eq('id', teamMemberId).single();
    
    if (agentProfile && interestUpdate.profiles?.phone && interestUpdate.preferred_meeting_time) {
        // Notify customer
        notificationService.sendPropertyInterestNotification(
            interestUpdate.customer_id,
            interestUpdate.properties?.title ?? 'the property',
            interestUpdate.properties?.price ?? 0,
            `${agentProfile.first_name} ${agentProfile.last_name}`,
            interestUpdate.preferred_meeting_time
        );

        // Notify agent
        notificationService.createNotification({
            user_id: teamMemberId,
            type: 'task_assigned',
            title: 'New Customer Assignment',
            message: `You have a new task to follow up with ${interestUpdate.profiles.first_name} regarding ${interestUpdate.properties.title}.`,
            data: { taskId: newTask?.id, customerName: `${interestUpdate.profiles.first_name} ${interestUpdate.profiles.last_name}` },
            send_via: 'whatsapp' // Also send a whatsapp to the agent
        });
    }

    console.log('--- Lead Assignment and Task Creation Successful ---');

    revalidatePath('/(dashboard)/admin');
    revalidatePath('/(dashboard)/tasks');
    revalidatePath('/(dashboard)/dashboard');

    return { success: true, message: 'Lead has been assigned, task created, and notifications sent.', task: newTask };
}
