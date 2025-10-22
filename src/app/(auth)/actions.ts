'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { loginSchema } from '@/schemas';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export async function login(values: z.infer<typeof loginSchema>) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.auth.signInWithPassword(values);

  if (error) {
    return redirect(`/login?message=${error.message}`);
  }
  
  // Redirect to the main dashboard. The layout will handle role-based logic.
  return redirect('/dashboard');
}
