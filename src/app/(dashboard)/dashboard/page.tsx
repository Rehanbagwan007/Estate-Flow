import { RoleDashboard } from '@/components/dashboard/role-dashboard';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // This can happen in a race condition right after signup, but since admin creates users,
    // it's more likely an error. Safest place to go is login.
    return redirect('/login?message=Profile not found.');
  }

  // Render the role-specific dashboard.
  return <RoleDashboard userRole={profile.role} userId={user.id} />;
}
