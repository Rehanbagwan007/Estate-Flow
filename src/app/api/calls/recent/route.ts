import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
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
      .from('call_logs')
      .select(`
        *,
        agent:profiles(*),
        customer:profiles(*)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    // Role-based filtering
    if (['agent', 'caller_1', 'caller_2', 'sales_executive_1', 'sales_executive_2'].includes(profile.role)) {
      query = query.eq('agent_id', user.id);
    } else if (['admin', 'super_admin'].includes(profile.role)) {
      // Admins can see all calls
    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { data: calls, error } = await query;

    if (error) {
      console.error('Error fetching recent calls:', error);
      return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      calls: calls || []
    });

  } catch (error) {
    console.error('Error in recent calls API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
