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

  // The main layout now handles the user check, so a full redirect is safe here.
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, approval_status')
    .eq('id', user.id)
    .single();

  // If the profile is missing after login, it's a valid reason to redirect.
  if (!profile) {
    return redirect('/login?error=profile_not_found');
  }

  // This is the correct place to handle this specific redirect.
  // The layout ensures the user is logged in, and this page directs them based on their status.
  if (profile.role === 'customer' && profile.approval_status !== 'approved') {
    redirect('/pending-approval');
  }

  return <RoleDashboard userRole={profile.role} userId={user.id} />;
}
