
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

    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('Authentication error: You must be logged in.');
        }
        
        // 1. Fetch the property interest to get customer and property details
        const { data: interest, error: interestError } = await supabase
            .from('property_interests')
            .select(`
                *, 
                properties:property_id(title, price), 
                profiles:customer_id(first_name, last_name, phone)
            `)
            .eq('id', propertyInterestId)
            .single();

        if (interestError || !interest) {
            console.error('[AssignLead] Error fetching property interest:', interestError);
            throw new Error('Could not find the property interest to assign.');
        }
        
        if (!interest.customer_id || !interest.profiles) {
             console.error('[AssignLead] Error: Property interest is missing a customer.');
            throw new Error('Cannot assign lead: The property interest is not linked to a customer.');
        }
        
        if (!interest.properties) {
            console.error('[AssignLead] Error: Property interest is missing property details.');
            throw new Error('Cannot assign lead: The property interest is not linked to a property.');
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
      
        if (assignmentError || !assignment) {
            console.error('[AssignLead] Error creating agent assignment:', assignmentError);
            throw new Error(`Failed to create lead assignment: ${assignmentError.message}`);
        }
        console.log('[AssignLead] Successfully created agent assignment:', assignment.id);
        
        // 3. Create the associated task for the agent
        const taskPayload = {
            title: `Follow up with ${interest.profiles.first_name} ${interest.profiles.last_name}`,
            description: `Customer is interested in the property: "${interest.properties.title}". Please contact them.`,
            assigned_to: teamMemberId,
            created_by: user.id,
            status: 'Todo',
            due_date: taskDueDate,
            related_property_id: interest.property_id
        };

        const { data: newTask, error: taskError } = await supabase
            .from('tasks')
            .insert(taskPayload)
            .select()
            .single();
            
        if (taskError || !newTask) {
            console.error("[AssignLead] CRITICAL: Failed to create task:", taskError);
            // ROLLBACK the assignment if task creation fails
            await supabase.from('agent_assignments').delete().eq('id', assignment.id);
            throw new Error(`Failed to create follow-up task, assignment has been rolled back. Error: ${taskError.message}`);
        }
        console.log('[AssignLead] Successfully created task:', newTask.id);

        // 4. Update the original property interest status to 'assigned'
        const { error: updateError } = await supabase
          .from('property_interests')
          .update({ status: 'assigned' })
          .eq('id', propertyInterestId);

        if (updateError) {
            // This is not a critical failure, but should be logged.
            console.warn('[AssignLead] Warning: Failed to update interest status, but assignment and task were created.', updateError);
        }

        // --- NOTIFICATION LOGIC (can be run without blocking the response) ---
        // Using a separate function to avoid breaking the main flow
        const sendNotifications = async () => {
            const { data: agentProfile } = await supabase.from('profiles').select('first_name, last_name, phone').eq('id', teamMemberId).single();
            if (agentProfile && interest.profiles?.phone && interest.preferred_meeting_time) {
                notificationService.sendPropertyInterestNotification(
                    interest.customer_id,
                    interest.properties?.title ?? 'the property',
                    interest.properties?.price ?? 0,
                    `${agentProfile.first_name} ${agentProfile.last_name}`,
                    interest.preferred_meeting_time
                );
                notificationService.createNotification({
                    user_id: teamMemberId,
                    type: 'task_assigned',
                    title: 'New Customer Assignment',
                    message: `You have a new task to follow up with ${interest.profiles.first_name} regarding ${interest.properties.title}.`,
                    data: { taskId: newTask?.id, customerName: `${interest.profiles.first_name} ${interest.profiles.last_name}` },
                    send_via: 'whatsapp'
                });
            }
        };
        sendNotifications();

        console.log('--- Lead Assignment Transaction Successful ---');

        revalidatePath('/(dashboard)/admin');
        revalidatePath('/(dashboard)/tasks');
        revalidatePath('/(dashboard)/dashboard');

        return { success: true, message: 'Lead has been assigned, task created, and notifications sent.', task: newTask };

    } catch (error: any) {
        console.error("[AssignLead] An error occurred during the transaction:", error.message);
        return { success: false, message: error.message || "An unknown error occurred during lead assignment." };
    }
}
