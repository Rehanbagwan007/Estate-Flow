import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notificationService } from '@/lib/notifications/notification-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or super admin
    const { data: profile } = await (await supabase)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, action, reason } = body;

    if (!user_id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update user approval status
    const approvalStatus = action === 'approve' ? 'approved' : 'rejected';
    const approvedAt = action === 'approve' ? new Date().toISOString() : null;

    const { data: updatedUser, error } = await (await supabase)
      .from('profiles')
      .update({
        approval_status: approvalStatus,
        approved_by: user.id,
        approved_at: approvedAt
      })
      .eq('id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user approval:', error);
      return NextResponse.json({ error: 'Failed to update user approval' }, { status: 500 });
    }

    // Send notification to user
    await notificationService.sendApprovalNotification(
      user_id,
      approvalStatus,
      reason
    );

    return NextResponse.json({ 
      success: true, 
      message: `User ${action}d successfully`,
      user: updatedUser
    });

  } catch (error) {
    console.error('Error in approve user API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
