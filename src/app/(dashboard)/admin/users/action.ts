'use server';

import { z } from 'zod';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { signupSchema } from '@/schemas';
import { Resend } from 'resend';
import { CredentialsEmail } from '@/components/emails/redentials-email';

const createAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        throw new Error('Supabase URL or service role key is missing.');
    }
    
    return createSupabaseClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
};

export async function createUser(values: z.infer<typeof signupSchema>) {
    const supabaseAdmin = createAdminClient();
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
        throw new Error('Resend API key is missing. Please set it in your .env.local file.');
    }

    const resend = new Resend(resendApiKey);

    // Step 1: Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: values.email,
        phone: values.phone,
        password: values.password,
        email_confirm: true,
        user_metadata: {
            first_name: values.firstName,
            last_name: values.lastName,
            role: values.role,
            phone: values.phone,
        },
    });

    if (authError) {
        console.error('Error creating user in Auth:', authError.message);
        return { error: `Failed to create user: ${authError.message}` };
    }

    if (!authData.user) {
        return { error: 'User was not created in Auth.' };
    }

    // Step 2: Send the credentials email using Resend
    try {
        await resend.emails.send({
            from: 'EstateFlow CRM <onboarding@resend.dev>', // You can change this
            to: values.email,
            subject: 'Your New Account Credentials',
            react: CredentialsEmail({
                firstName: values.firstName,
                email: values.email,
                password: values.password,
            }),
        });
    } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Even if the email fails, we don't want to block the user creation.
        // You might want to add more robust error handling here.
        return { error: 'User was created, but the credential email could not be sent.' };
    }
    
    revalidatePath('/admin/users');

    return { data: authData.user, message: 'User created and credentials have been sent!' };
}
