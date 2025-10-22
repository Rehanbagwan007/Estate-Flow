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

  // The layout already handles the redirect if there is no user.
  if (!user) {
    // This should theoretically not be reached because of the layout's protection
    return redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // The layout has also handled the case of a missing profile.
  if (!profile) {
    // This should also not be reached
    await supabase.auth.signOut();
    return redirect('/login?message=Profile not found. Please log in again.');
  }

  // Render the role-specific dashboard.
  return <RoleDashboard userRole={profile.role} userId={user.id} />;
}
