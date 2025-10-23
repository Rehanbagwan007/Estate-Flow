import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'customer') {
      return NextResponse.json({ error: 'Only customers can express interest.' }, { status: 403 });
    }

    const body = await request.json();
    const { property_id, interest_level, preferred_meeting_time, phone } = body;

    if (!property_id || !interest_level) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create property interest
    const { data: interest, error } = await supabase
      .from('property_interests')
      .insert({
        property_id,
        customer_id: user.id,
        interest_level,
        preferred_meeting_time,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating property interest:', error);
      return NextResponse.json({ error: `Failed to create interest: ${error.message}` }, { status: 500 });
    }

    // Update customer phone if provided
    if (phone) {
      await supabase
        .from('profiles')
        .update({ phone })
        .eq('id', user.id);
    }
    
    return NextResponse.json({ success: true, interest });
  } catch (error) {
    console.error('Error in property interests API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    let query = supabase
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
