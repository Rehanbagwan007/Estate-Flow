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

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    return { error: `Database error checking for profile: ${profileError.message}` };
  }

  if (!profile) {
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
      return { error: `Failed to create user profile: ${createProfileError.message}` };
    }
  }

  // The redirect will be handled by the middleware after the client reloads.
  // We just need to signal success to the client form.
  return { success: true };
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

  return { data };
}
