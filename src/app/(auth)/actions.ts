'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { loginSchema, signupSchema } from '@/schemas';
import { redirect } from 'next/navigation';

export async function login(values: z.infer<typeof loginSchema>) {
  const supabase = createClient();
  const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword(values);

  if (loginError) {
    return { error: loginError.message };
  }

  if (!user) {
    return { error: 'Login successful, but no user object was returned.' };
  }

  // --- Definitive Fix: Check for and create profile if it doesn't exist ---
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    // PGRST116 is "exact-single-row-not-found", which is what we expect if the profile is missing.
    // Any other error should be reported.
    return { error: `Database error checking for profile: ${profileError.message}` };
  }

  if (!profile) {
    // The profile doesn't exist. Create it now.
    const { error: createProfileError } = await supabase
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
      // If we can't create the profile, we can't proceed.
      return { error: `Failed to create user profile: ${createProfileError.message}` };
    }
  }
  // --- End of Fix ---

  redirect('/dashboard');
}

export async function signup(values: z.infer<typeof signupSchema>) {
  const supabase = createClient();
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

  // The handle_new_user trigger in schema.sql should create the profile,
  // but the login logic now provides a robust fallback.
  return { data };
}
