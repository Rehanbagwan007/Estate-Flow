import { RoleDashboard } from '@/components/dashboard/role-dashboard';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, approval_status')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // This can happen in a race condition right after signup.
    // The safest place to go is the pending page, which will auto-refresh.
    return redirect('/pending-approval');
  }

  // This is now the single source of truth for this specific redirection.
  // If a user is a customer and their account is not approved, send them to the pending page.
  if (profile.role === 'customer' && profile.approval_status !== 'approved') {
    redirect('/pending-approval');
  }

  // For all other approved users, render their specific dashboard.
  return <RoleDashboard userRole={profile.role} userId={user.id} />;
}
