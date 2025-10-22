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
    // If the profile is still missing, the layout will handle the redirect
    // to the pending page. This check is a safeguard.
    return redirect('/pending-approval');
  }

  // This is the correct place to handle this specific redirect.
  // The layout ensures the user is logged in, and this page directs them based on their status.
  if (profile.role === 'customer' && profile.approval_status !== 'approved') {
    redirect('/pending-approval');
  }

  return <RoleDashboard userRole={profile.role} userId={user.id} />;
}
