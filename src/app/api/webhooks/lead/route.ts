
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
            
            console.log(`Processing leadgen_id: ${leadgenId} from form_id: ${formId}`);
            
            // --- STEP 1: Fetch the actual lead data using the leadgen_id ---
            const accessToken = process.env.META_ACCESS_TOKEN;
            if (!accessToken) {
                console.error("CRITICAL: META_ACCESS_TOKEN is not configured.");
                throw new Error("META_ACCESS_TOKEN is not configured in environment variables.");
            }

            const leadDetailsResponse = await fetch(`https://graph.facebook.com/v19.0/${leadgenId}?access_token=${accessToken}`);
            const leadDetails = await leadDetailsResponse.json();
            
            console.log("--- Fetched Lead Details from Graph API ---", JSON.stringify(leadDetails, null, 2));

            if (leadDetails.error) {
              console.error(`Graph API error fetching lead details for ${leadgenId}:`, leadDetails.error);
              throw new Error(`Failed to fetch lead details: ${leadDetails.error.message}`);
            }

            // --- STEP 2: Robustly extract fields from the detailed lead data ---
            const fieldData: { [key: string]: string } = {};
            for(const field of leadDetails.field_data) {
                fieldData[field.name] = field.values[0];
            }
            
            const fullName = fieldData.full_name || '';
            const email = fieldData.email || null;
            const phone = fieldData.phone_number || null;

            if (!fullName || !phone) {
                console.error("Essential lead data (full_name or phone_number) is missing from the fetched details.");
                continue; // Skip this lead and process the next one
            }
            
            const nameParts = fullName.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';


            // --- STEP 3: Save the lead to the database ---
            console.log(`Attempting to insert lead: ${firstName} ${lastName}`);
            const { error: leadError } = await supabaseAdmin
              .from('leads')
              .insert({
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: phone,
                status: 'Warm', // Default status for new webhook leads
                source: `Facebook/Instagram Form (${formId})`
              });

            if (leadError) {
              console.error('Supabase error creating lead:', leadError);
              // Don't throw, just log it and continue processing other leads
            } else {
              console.log(`Successfully created lead for ${fullName} in the database.`);
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
