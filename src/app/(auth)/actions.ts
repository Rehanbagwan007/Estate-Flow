'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { loginSchema } from '@/schemas';
import { redirect } from 'next/navigation';

export async function login(values: z.infer<typeof loginSchema>) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(values);

  if (error) {
    return redirect(`/login?message=${error.message}`);
  }
  
  // Redirect to the main dashboard. The layout will handle role-based logic.
  return redirect('/dashboard');
}
