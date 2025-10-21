import { RoleDashboard } from '@/components/dashboard/role-dashboard';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('Dashboard page user:', user)

  if (!user) {
    redirect('/login');
  }

  console.log('User ID:', user.id)

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  console.log('Profile data:', profile)
  console.log('Profile error:', profileError)

  // If no profile exists, create one with default role
  if (!profile && profileError?.code === 'PGRST116') {
    console.log('Creating default profile for user')
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        first_name: user.user_metadata?.first_name || 'User',
        last_name: user.user_metadata?.last_name || '',
        email: user.email,
        role: user.user_metadata?.role || 'agent'
      })
      .select('role')
      .single();

    if (createError) {
      console.error('Error creating profile:', createError)
      redirect('/login');
    }

    return <RoleDashboard userRole={newProfile.role} userId={user.id} />;
  }

  if (!profile) {
    console.error('No profile found and could not create one')
    redirect('/login');
  }

  // Note: Customer approval check removed since approval_status column doesn't exist yet

  return <RoleDashboard userRole={profile.role} userId={user.id} />;
}
