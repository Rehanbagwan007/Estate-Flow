
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
      return NextResponse.json({ error: 'Agent ID and customer phone are required' }, { status: 400 });
    }

    // --- Live Exotel Integration ---
    const apiKey = process.env.EXOTEL_API_KEY;
    const apiToken = process.env.EXOTEL_API_TOKEN;
    const subdomain = process.env.EXOTEL_SUBDOMAIN;
    const callerId = process.env.NEXT_PUBLIC_EXOTEL_CALLER_ID;

    if (!apiKey || !apiToken || !subdomain || !callerId) {
        return NextResponse.json({ error: 'Exotel credentials are not configured on the server.' }, { status: 500 });
    }

    // 1. Fetch the agent's phone number from their profile
    const { data: agentProfile, error: agentError } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', agent_id)
      .single();

    if (agentError || !agentProfile?.phone) {
        console.error('Error fetching agent phone or phone not found:', agentError);
        return NextResponse.json({ error: 'Could not find a valid phone number for the agent.' }, { status: 400 });
    }
    
    // Generate a unique call ID for logging
    const callLogId = `crm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 2. Make the API call to Exotel to connect the agent to the customer
    const exotelApiUrl = `https://${subdomain}.exotel.com/v1/Accounts/${apiKey}/Calls/connect.json`;
    const params = new URLSearchParams({
        From: agentProfile.phone,      // The agent's number
        To: customer_phone,             // The customer's number
        CallerId: callerId,             // Your Exotel virtual number
        Record: 'true',                 // Record the call
        CustomField: `call_log_id=${callLogId}` // Pass our internal ID
    });

    const response = await fetch(exotelApiUrl, {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + btoa(`${apiKey}:${apiToken}`),
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    const exotelResponse = await response.json();

    // 3. Log the call initiation attempt in our database
    const callSid = exotelResponse.Call?.Sid;
    const callStatus = exotelResponse.Call?.Status || (exotelResponse.RestException ? 'failed' : 'initiated');

    const { data: callLog, error: logError } = await supabase
      .from('call_logs')
      .insert({
        call_id: callSid || callLogId, // Use Exotel's SID if available, otherwise our fallback
        agent_id,
        customer_id: customer_id || null,
        call_type: call_type || 'outbound',
        call_status: callStatus.toLowerCase(),
        duration_seconds: 0
      })
      .select()
      .single();
    
    if (logError) {
        console.error('CRITICAL: Failed to log call after successful API request:', logError);
        // Don't block the user, but this needs monitoring
    }

    if (!response.ok || exotelResponse.RestException) {
      console.error('Exotel API Error:', exotelResponse.RestException);
      return NextResponse.json({ error: exotelResponse.RestException.Message || 'Failed to initiate call via Exotel' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      call_id: callSid,
      message: 'Call initiated successfully through Exotel.'
    });

  } catch (error) {
    console.error('Error in call initiate API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 });
  }
}
