import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, role, approval_status')
    .eq('id', user.id)
    .single();

  // If there's an error and it's not the "no rows found" error, something is wrong.
  if (profileError && profileError.code !== 'PGRST116') {
    console.error('Error fetching profile in layout:', profileError);
    redirect('/login');
  }
  
  // If the profile is still not found after login, redirect to login.
  if (!profile) {
    console.error('No profile found for user in layout, redirecting to login.', { userId: user.id });
    redirect('/login?error=profile_not_found');
  }
  
  // Handle customer approval flow
  if (profile.role === 'customer' && profile.approval_status !== 'approved') {
    return redirect('/pending-approval');
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar userRole={profile.role}/>
      <div className="flex flex-col">
        <Header user={user} profile={profile} />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
