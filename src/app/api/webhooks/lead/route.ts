
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase admin client ONCE, outside of the handler functions.
// This is more efficient than creating a new client on every request.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Handles the webhook verification GET request from Meta.
 * This is the first step to ensure your server can communicate with Meta.
 */
export async function GET(request: NextRequest) {
  console.log("--- Received GET request on webhook ---");
  const webhookSecret = process.env.WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error("CRITICAL: WEBHOOK_SECRET is not configured in environment variables.");
    return new NextResponse('Internal Server Error: Webhook secret not configured.', { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  console.log("Verification Attempt Details:", {
    mode,
    received_token: token ? `***${token.slice(-4)}` : "None",
    expected_token: `***${webhookSecret.slice(-4)}`,
    challenge_present: !!challenge
  });

  // Check if mode and token are present, and if the token matches the secret
  if (mode === 'subscribe' && token === webhookSecret) {
    // Respond with the challenge to verify the webhook
    console.log("Webhook verification successful! Responding with challenge.");
    return new NextResponse(challenge, { status: 200 });
  } else {
    // Respond with '403 Forbidden' if tokens do not match
    console.error("Webhook verification failed.");
    return new NextResponse('Verification token mismatch', { status: 403 });
  }
}

/**
 * Handles incoming lead data via POST request from Meta.
 */
export async function POST(request: NextRequest) {
  console.log("--- Received Webhook POST Request ---");
  try {
    const bodyText = await request.text();
    if (!bodyText) {
        console.warn("Webhook POST request received with empty body.");
        return NextResponse.json({ success: true, message: 'Empty request body received.' });
    }

    const body = JSON.parse(bodyText);
    console.log("Payload body:", JSON.stringify(body, null, 2));

    // Meta sends a payload with an `entry` array
    if (body.object === 'page' && body.entry) {
      for (const entry of body.entry) {
        if (!entry.changes) continue;

        for (const change of entry.changes) {
          if (change.field === 'leadgen' && change.value) {
            const leadData = change.value;
            const formId = leadData.form_id;
            const leadgenId = leadData.leadgen_id;
            
            console.log(`Processing leadgen_id: ${leadgenId} from form_id: ${formId}`);
            
            // --- STEP 1: Fetch the actual lead data using the leadgen_id ---
            const accessToken = process.env.META_ACCESS_TOKEN;
            if (!accessToken) {
                console.error("CRITICAL: META_ACCESS_TOKEN is not configured.");
                // We don't throw an error back to Meta, as they might disable the webhook.
                // We log it and continue.
                continue; 
            }

            const leadDetailsResponse = await fetch(`https://graph.facebook.com/v19.0/${leadgenId}?access_token=${accessToken}`);
            const leadDetails = await leadDetailsResponse.json();
            
            console.log("--- Fetched Lead Details from Graph API ---", JSON.stringify(leadDetails, null, 2));

            if (leadDetails.error) {
              console.error(`Graph API error fetching lead details for ${leadgenId}:`, leadDetails.error);
              continue; // Skip this lead and process the next one
            }

            // --- STEP 2: Robustly extract fields from the detailed lead data ---
            const fieldData: { [key: string]: string } = {};
            if (Array.isArray(leadDetails.field_data)) {
                for(const field of leadDetails.field_data) {
                    if (field.name && Array.isArray(field.values) && field.values.length > 0) {
                        fieldData[field.name] = field.values[0];
                    }
                }
            }
            
            // Allow for variations in field names
            const fullName = fieldData.full_name || fieldData['Full Name'] || '';
            const email = fieldData.email || fieldData.Email || null;
            const phone = fieldData.phone_number || fieldData['Phone Number'] || null;

            if (!fullName || !phone) {
                console.error("Essential lead data (full_name or phone_number) is missing from the fetched details.");
                continue; // Skip this lead
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
            } else {
              console.log(`Successfully created lead for ${fullName} in the database.`);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processed.' });

  } catch (error) {
    console.error('Unhandled Webhook POST error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    // Return a 200 OK even on error to prevent Meta from disabling the webhook
    return NextResponse.json({ success: true, message: `Webhook processed with internal error: ${errorMessage}` });
  }
}
