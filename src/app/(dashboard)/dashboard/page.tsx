
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

  // The middleware has already ensured the user is logged in.
  if (!user) {
    // This should theoretically never be reached.
    return redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // The middleware has already ensured a profile exists.
  if (!profile) {
     // This should theoretically never be reached.
    return redirect('/login?message=Profile not found.');
  }

  // Render the role-specific dashboard.
  return <RoleDashboard userRole={profile.role} userId={user.id} />;
}
