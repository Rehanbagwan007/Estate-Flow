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

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.WEBHOOK_SECRET;
  const token = request.headers.get('Authorization')?.split(' ')[1];

  if (!webhookSecret || token !== webhookSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
