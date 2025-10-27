
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Simplified schema, as we'll parse the fields manually
const leadSchema = z.object({
  full_name: z.string(),
  email: z.string().email().optional(),
  phone_number: z.string(),
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
    console.log("Webhook verified successfully!");
    return new NextResponse(challenge, { status: 200 });
  } else {
    // Respond with '403 Forbidden' if tokens do not match
    console.error("Webhook verification failed. Tokens did not match.");
    return new NextResponse('Verification token mismatch', { status: 403 });
  }
}

/**
 * Handles incoming lead data via POST request from Meta.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("--- Received Webhook Payload ---", JSON.stringify(body, null, 2));

    // Meta sends a payload with an `entry` array
    if (body.object === 'page' && body.entry) {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'leadgen') {
            const leadData = change.value;
            const formId = leadData.form_id;
            const leadgenId = leadData.leadgen_id;
            
            // --- STEP 1: Fetch the actual lead data using the leadgen_id ---
            // This requires a Page Access Token with leads_retrieval permission.
            const accessToken = process.env.META_ACCESS_TOKEN;
            if (!accessToken) {
                throw new Error("META_ACCESS_TOKEN is not configured in environment variables.");
            }

            const leadDetailsResponse = await fetch(`https://graph.facebook.com/v19.0/${leadgenId}?access_token=${accessToken}`);
            const leadDetails = await leadDetailsResponse.json();
            
            console.log("--- Fetched Lead Details from Graph API ---", JSON.stringify(leadDetails, null, 2));

            if (leadDetails.error) {
              throw new Error(`Failed to fetch lead details: ${leadDetails.error.message}`);
            }

            // --- STEP 2: Extract fields from the detailed lead data ---
            let email, phone, fullName;
            for(const field of leadDetails.field_data) {
                if (field.name === 'full_name') fullName = field.values[0];
                if (field.name === 'email') email = field.values[0];
                if (field.name === 'phone_number') phone = field.values[0];
            }
            
            if (!fullName || !phone) {
                console.error("Essential lead data (full name or phone) is missing from the fetched details.");
                continue; // Skip this lead and process the next one
            }

            // --- STEP 3: Save the lead to the database ---
            const { error: leadError } = await supabaseAdmin
              .from('leads')
              .insert({
                first_name: fullName.split(' ')[0], // Simple split for first name
                last_name: fullName.split(' ').slice(1).join(' ') || fullName.split(' ')[0], // The rest is last name
                email: email,
                phone: phone,
                status: 'Warm', // Default status for new webhook leads
                source: `Facebook/Instagram Form (${formId})`
              });

            if (leadError) {
              console.error('Supabase error creating lead:', leadError);
              // Don't throw, just log it and continue processing other leads
            } else {
              console.log(`Successfully created lead for ${fullName}`);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processed.' });

  } catch (error) {
    console.error('Webhook POST error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
