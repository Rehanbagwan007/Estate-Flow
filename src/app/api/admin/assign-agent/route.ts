import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notificationService } from '@/lib/notifications/notification-service';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or super admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { property_interest_id, agent_id, assignment_type, priority, notes } = body;

    if (!property_interest_id || !agent_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get property interest details
    const { data: propertyInterest } = await supabase
      .from('property_interests')
      .select(`
        *,
        property:properties(*),
        customer:profiles(*)
      `)
      .eq('id', property_interest_id)
      .single();

    if (!propertyInterest) {
      return NextResponse.json({ error: 'Property interest not found' }, { status: 404 });
    }

    // Create agent assignment
    const { data: assignment, error } = await supabase
      .from('agent_assignments')
      .insert({
        agent_id,
        customer_id: propertyInterest.customer_id,
        property_interest_id,
        assigned_by: user.id,
        assignment_type: assignment_type || 'property_interest',
        priority: priority || 'medium',
        status: 'assigned',
        notes
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating agent assignment:', error);
      return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
    }

    // Update property interest status
    await supabase
      .from('property_interests')
      .update({ 
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', property_interest_id);

    // Get agent details
    const { data: agent } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone')
      .eq('id', agent_id)
      .single();

    // Send notification to customer
    if (propertyInterest.preferred_meeting_time) {
      await notificationService.sendPropertyInterestNotification(
        propertyInterest.customer_id,
        propertyInterest.property?.title || 'Property',
        propertyInterest.property?.price || 0,
        `${agent?.first_name} ${agent?.last_name}`,
        propertyInterest.preferred_meeting_time
      );
    }

    // Create notification for agent
    await supabase
      .from('notifications')
      .insert({
        user_id: agent_id,
        type: 'task_assigned',
        title: 'New Customer Assignment',
        message: `You have been assigned to follow up with a customer interested in ${propertyInterest.property?.title}`,
        data: {
          assignment_id: assignment.id,
          customer_id: propertyInterest.customer_id,
          property_interest_id,
          property_title: propertyInterest.property?.title
        }
      });

    return NextResponse.json({ 
      success: true, 
      message: 'Agent assigned successfully',
      assignment
    });

  } catch (error) {
    console.error('Error in assign agent API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
