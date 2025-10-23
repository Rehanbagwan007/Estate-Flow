import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

<<<<<<< HEAD
export default async function RootPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
=======
export default function RootPage() {
  // Always redirect from the root to the dashboard.
  // The dashboard layout will handle authentication.
  return redirect('/dashboard');
>>>>>>> 2a2cb5be7b204e2fcf4530a65a8b7c337ab406e7
}
