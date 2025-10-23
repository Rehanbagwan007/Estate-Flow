// src/app/(auth)/actions.ts
'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { loginSchema, signupSchema } from '@/schemas';
import { redirect } from 'next/navigation';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// This function creates a Supabase client with the service role key, giving it admin privileges.
const createServiceRoleClient = () => {
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

export async function login(values: z.infer<typeof loginSchema>) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword(values);

  if (loginError) {
    return { error: loginError.message };
  }

  if (!user) {
    return { error: 'Login successful, but no user object was returned.' };
  }

  // Use the admin client to bypass RLS and check for the profile.
  const supabaseAdmin = createServiceRoleClient();
  
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
    return { error: `Database error checking for profile: ${profileError.message}` };
  }

  // If the profile doesn't exist, create it with the admin client.
  if (!profile) {
    const { error: createProfileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        first_name: user.user_metadata.first_name || 'New',
        last_name: user.user_metadata.last_name || 'User',
        role: user.user_metadata.role || 'customer',
        phone: user.phone || user.user_metadata.phone,
      });
      
    if (createProfileError) {
      return { error: `Failed to create user profile: ${createProfileError.message}` };
    }
  }

  redirect('/dashboard');
}

export async function signup(values: z.infer<typeof signupSchema>) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: {
        first_name: values.firstName,
        last_name: values.lastName,
        role: values.role,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

// You can keep this function for fetching the session in your pages and layouts
export async function readUserSession() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    return { user: null, profile: null };
  }

  // This query will correctly use RLS to only get the logged-in user's profile.
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.session.user.id)
    .single();


      console.log(profile ,  "profile")
  return { user: data.session.user, profile };
}