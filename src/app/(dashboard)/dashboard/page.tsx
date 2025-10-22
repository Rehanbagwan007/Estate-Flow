
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

  // The layout has already handled the redirect if there is no user.
  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // The layout has already handled the case of a missing profile.
  if (!profile) {
    return null;
  }

  // Render the role-specific dashboard.
  return <RoleDashboard userRole={profile.role} userId={user.id} />;
}
