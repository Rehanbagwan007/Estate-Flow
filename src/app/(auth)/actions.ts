'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { loginSchema } from '@/schemas';
import { signupSchema } from '@/schemas';
import { redirect } from 'next/navigation';

export async function login(values: z.infer<typeof loginSchema>) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(values);

  if (error) {
    return { error: error.message };
  }

  // On success, the server will handle the redirect.
  // The client no longer needs to do anything.
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
        phone: values.phone,
        role: values.role,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // The handle_new_user trigger in schema.sql will create the profile.
  return { data };
}
