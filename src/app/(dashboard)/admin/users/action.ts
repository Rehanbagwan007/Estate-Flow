
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
        throw new Error('Supabase URL or service role key is missing. Make sure SUPABASE_SERVICE_ROLE_KEY is set in your environment variables.');
    }
    
    // Correctly initialize the admin client for server-side operations
    return createSupabaseClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
};

export async function createUser(values: z.infer<typeof signupSchema>) {
    let supabaseAdmin;
    try {
        supabaseAdmin = createAdminClient();
    } catch (e: any) {
        return { error: e.message };
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
        return { error: 'Resend API key is missing. Cannot send emails.' };
    }
    const resend = new Resend(resendApiKey);

    // Step 1: Create the user in Supabase Auth with a minimal payload
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: values.email,
        password: values.password,
        email_confirm: true,
        user_metadata: {
            role: values.role,
        },
    });

    if (authError) {
        console.error('Error creating user in Auth:', authError);
        return { error: `Failed to create auth user: ${authError.message}` };
    }

    const user = authData.user;
    if (!user) {
        return { error: 'User was not created in Auth.' };
    }
    
    // Step 2: Explicitly insert into profiles table using the admin client.
    // This bypasses RLS and is more reliable than the trigger.
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
            id: user.id,
            first_name: values.firstName,
            last_name: values.lastName,
            email: values.email,
            phone: values.phone,
            role: values.role,
        });

    if (profileError) {
        console.error('Error creating user profile:', profileError);
        // If profile creation fails, we should delete the auth user to avoid orphans
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        return { error: `Failed to create user profile: ${profileError.message}` };
    }


    // Step 3: Send the credentials email using Resend
    try {
        await resend.emails.send({
            from: 'EstateFlow CRM <onboarding@resend.dev>',
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
        return { data: user, message: 'User was created, but the credential email could not be sent.' };
    }
    
    revalidatePath('/(dashboard)/admin/users');

    return { data: user, message: 'User created and credentials have been sent!' };
}

export async function updateUserRole(userId: string, role: z.infer<typeof signupSchema>['role']) {
    const supabaseAdmin = createAdminClient();
  
    const { data, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: role })
      .eq('id', userId)
      .select()
      .single();
  
    if (profileError) {
      console.error('Error updating profile role:', profileError.message);
      return { error: `Failed to update user role in profile: ${profileError.message}` };
    }
  
    revalidatePath('/(dashboard)/admin/users');
  
    return { data, message: 'User role updated successfully!' };
}
  
export async function deleteUser(userId: string) {
    const supabaseAdmin = createAdminClient();

    // The database is configured with a cascade delete.
    // Deleting the auth user will automatically delete the corresponding profile.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
        console.error('Error deleting user:', error.message);
        return { error: `Failed to delete user: ${error.message}` };
    }

    revalidatePath('/(dashboard)/admin/users');

    return { message: 'User deleted successfully!' };
}
