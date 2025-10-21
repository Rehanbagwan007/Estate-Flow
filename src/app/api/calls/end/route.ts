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

    const body = await request.json();
    const { call_id, duration, notes } = body;

    if (!call_id) {
      return NextResponse.json({ error: 'Missing call ID' }, { status: 400 });
    }

    // Update call log with end details
    const { data: callLog, error } = await (await supabase)
      .from('call_logs')
      .update({
        call_status: 'completed',
        duration_seconds: duration || 0,
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('call_id', call_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating call log:', error);
      return NextResponse.json({ error: 'Failed to update call log' }, { status: 500 });
    }

    // Simulate recording URL generation
    const recordingUrl = `https://exotel-recordings.s3.amazonaws.com/${call_id}.mp3`;

    // Update with recording URL
    await (await supabase)
      .from('call_logs')
      .update({
        recording_url: recordingUrl,
        recording_duration_seconds: duration || 0
      })
      .eq('call_id', call_id);

    return NextResponse.json({ 
      success: true, 
      message: 'Call ended successfully',
      recording_url: recordingUrl
    });

  } catch (error) {
    console.error('Error in call end API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
