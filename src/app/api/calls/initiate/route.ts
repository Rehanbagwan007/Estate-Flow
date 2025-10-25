import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { agent_id, customer_phone, customer_id, call_type } = body;

    if (!agent_id || !customer_phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate a unique call ID (simulating Exotel call ID)
    const callId = `exotel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create call log entry
    const { data: callLog, error } = await supabase
      .from('call_logs')
      .insert({
        call_id: callId,
        agent_id,
        customer_id: customer_id || null,
        call_type: call_type || 'outbound',
        call_status: 'initiated',
        duration_seconds: 0
      })
      .select()
      .single();

      console.log(callLog)

    if (error) {
      console.error('Error creating call log:', error);
      return NextResponse.json({ error: 'Failed to create call log' }, { status: 500 });
    }

    // Simulate Exotel API call
    // In a real implementation, you would call the actual Exotel API here
    const exotelResponse = await simulateExotelCall(callId, customer_phone);

    if (!exotelResponse.success) {
      // Update call status to failed
      await supabase
        .from('call_logs')
        .update({ call_status: 'failed' })
        .eq('id', callLog.id);

      return NextResponse.json({ 
        error: exotelResponse.error || 'Failed to initiate call' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      call_id: callId,
      message: 'Call initiated successfully'
    });

  } catch (error) {
    console.error('Error in call initiate API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Simulate Exotel API call
async function simulateExotelCall(callId: string, phoneNumber: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simulate success/failure (90% success rate)
  const isSuccess = Math.random() > 0.1;

  if (isSuccess) {
    return {
      success: true,
      call_id: callId,
      status: 'initiated'
    };
  } else {
    return {
      success: false,
      error: 'Phone number unreachable'
    };
  }
}
