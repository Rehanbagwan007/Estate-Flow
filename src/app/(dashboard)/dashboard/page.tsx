import { RoleDashboard } from '@/components/dashboard/role-dashboard';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, approval_status')
    .eq('id', user.id)
    .single();

  // This handles the case where a user is created in auth but the profile trigger fails or is delayed
  if (profileError && profileError.code === 'PGRST116') {
      console.error('Profile not found for user, redirecting to login.', { userId: user.id });
      // It's safer to log them out to force a clean slate.
      redirect('/login');
  }

  if (profileError) {
      console.error('Unexpected error fetching profile:', profileError);
      redirect('/login');
  }
  
  if (!profile) {
    console.error('No profile found and could not create one');
    redirect('/login');
  }
  
  // Customer approval logic
  if (profile.role === 'customer' && profile.approval_status !== 'approved') {
    redirect('/pending-approval');
  }

  return <RoleDashboard userRole={profile.role} userId={user.id} />;
}
