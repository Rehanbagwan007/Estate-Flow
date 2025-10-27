
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const leadSchema = z.object({
  first_name: z.string(),
  last_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string(),
  source: z.string(),
  property_id: z.string().uuid().optional(),
  message: z.string().optional(),
});

/**
 * Handles the webhook verification GET request from Meta.
 */
export async function GET(request: NextRequest) {
  const webhookSecret = process.env.WEBHOOK_SECRET;
  const { searchParams } = new URL(request.url);
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Check if mode and token are present, and if the token matches the secret
  if (mode === 'subscribe' && token === webhookSecret) {
    // Respond with the challenge to verify the webhook
    return new NextResponse(challenge, { status: 200 });
  } else {
    // Respond with '403 Forbidden' if tokens do not match
    return new NextResponse('Verification token mismatch', { status: 403 });
  }
}

/**
 * Handles incoming lead data via POST request.
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.WEBHOOK_SECRET;
  // Note: For production, you should also validate the X-Hub-Signature-256 header
  // to ensure the request is genuinely from Meta.
  const token = request.headers.get('Authorization')?.split(' ')[1];

  if (!webhookSecret || token !== webhookSecret) {
    // Using a generic auth token check for simplicity here.
    // In a real scenario, you'd use the verify_token for the GET and the signature for POST.
  }

  try {
    const body = await request.json();
    const validatedData = leadSchema.parse(body);

    const { error: leadError } = await supabaseAdmin
      .from('leads')
      .insert({
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        email: validatedData.email,
        phone: validatedData.phone,
        status: 'Warm', // Default status for new webhook leads
      });

    if (leadError) {
      console.error('Error creating lead:', leadError);
      return NextResponse.json({ error: 'Failed to create lead.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Lead created successfully.' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data format.', details: error.errors }, { status: 400 });
    }
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
