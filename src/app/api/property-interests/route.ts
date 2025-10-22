import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is approved customer
    const { data: profile } = await (await supabase)
      .from('profiles')
      .select('role, approval_status')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'customer' || profile.approval_status !== 'approved') {
      return NextResponse.json({ error: 'Customer not approved' }, { status: 403 });
    }

    const body = await request.json();
    const { property_id, interest_level, message, preferred_meeting_time, phone } = body;

    if (!property_id || !interest_level) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create property interest
    const { data: interest, error } = await (await supabase)
      .from('property_interests')
      .insert({
        property_id,
        customer_id: user.id,
        interest_level,
        message,
        preferred_meeting_time,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating property interest:', error);
      return NextResponse.json({ error: 'Failed to create interest' }, { status: 500 });
    }

    // Update customer phone if provided
    if (phone) {
      await (await supabase)
        .from('profiles')
        .update({ phone })
        .eq('id', user.id);
    }

    // Create notification for admins
    const { data: admins } = await (await supabase)
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'super_admin']);

    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        type: 'property_interest',
        title: 'New Property Interest',
        message: `A customer has expressed interest in a property`,
        data: {
          property_interest_id: interest.id,
          property_id,
          customer_id: user.id
        }
      }));

      await (await supabase)
        .from('notifications')
        .insert(notifications);
    }

    return NextResponse.json({ success: true, interest });
  } catch (error) {
    console.error('Error in property interests API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await (await supabase)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    let query = (await supabase)
      .from('property_interests')
      .select(`
        *,
        property:properties(*),
        customer:profiles(*)
      `);

    // Role-based filtering
    if (profile.role === 'customer') {
      query = query.eq('customer_id', user.id);
    } else if (['admin', 'super_admin'].includes(profile.role)) {
      // Admins can see all interests
    } else if (['agent', 'sales_executive_1', 'sales_executive_2'].includes(profile.role)) {
      // Agents can see interests assigned to them
      query = query.eq('assigned_agent_id', user.id);
    }

    const { data: interests, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching property interests:', error);
      return NextResponse.json({ error: 'Failed to fetch interests' }, { status: 500 });
    }

    return NextResponse.json({ interests });
  } catch (error) {
    console.error('Error in property interests GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
