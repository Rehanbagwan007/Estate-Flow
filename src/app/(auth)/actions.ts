'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { loginSchema, signupSchema } from '@/schemas';
import { redirect } from 'next/navigation';

export async function login(values: z.infer<typeof loginSchema>) {
  const supabase = createClient();
  const { data, error } = await (await supabase).auth.signInWithPassword(values);

  if (error) {
    return { error: error.message };
  }
  
  redirect('/');
}

export async function signup(values: z.infer<typeof signupSchema>) {
  const supabase = createClient();
  const { data, error } = await (await supabase).auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: {
        first_name: values.firstName,
        last_name: values.lastName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // The handle_new_user trigger in schema.sql will create the profile.
  return { data };
}
