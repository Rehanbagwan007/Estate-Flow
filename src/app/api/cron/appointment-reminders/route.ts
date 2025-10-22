import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/notifications/notification-service';

export async function GET(request: NextRequest) {
  try {
    // Verify cron job authorization (in production, use proper authentication)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Schedule appointment reminders
    await notificationService.scheduleAppointmentReminders();

    return NextResponse.json({ 
      success: true, 
      message: 'Appointment reminders processed successfully' 
    });

  } catch (error) {
    console.error('Error in appointment reminders cron:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Allow POST method as well for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
