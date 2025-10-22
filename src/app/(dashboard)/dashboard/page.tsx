import { RoleDashboard } from '@/components/dashboard/role-dashboard';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // The main layout now handles the user check, but we keep this as a safeguard.
  if (!user) {
    redirect('/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, approval_status')
    .eq('id', user.id)
    .single();
  
  // The layout also handles this, but it's good practice for a page to be self-sufficient.
  if (profileError || !profile) {
      console.error('Error fetching profile on dashboard page:', { profileError, userId: user.id });
      // This might indicate the profile is not yet created after signup.
      // Redirecting to login might cause a loop if the user is authenticated.
      // Let's redirect to a pending page or show an error.
      // For now, redirecting to login is the safest, but this could be improved.
      redirect('/login?error=profile_not_found');
  }
  
  // The layout handles this redirection, so this is redundant but safe.
  if (profile.role === 'customer' && profile.approval_status !== 'approved') {
    redirect('/pending-approval');
  }

  return <RoleDashboard userRole={profile.role} userId={user.id} />;
}
