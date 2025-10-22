'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { loginSchema, signupSchema } from '@/schemas';
import { redirect } from 'next/navigation';

export async function login(values: z.infer<typeof loginSchema>) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(values);

  if (error) {
    // Return the error message to be displayed on the login form
    return { error: error.message };
  }
  
  // Do not redirect here. The middleware will handle redirecting to the dashboard.
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

  // The handle_new_user trigger in schema.sql will create the profile.
  return { data };
}
