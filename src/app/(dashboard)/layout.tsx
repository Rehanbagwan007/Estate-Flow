
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, role, approval_status')
    .eq('id', user.id)
    .single();
  
  if (!profile) {
    // This can happen if the profile creation failed or is delayed.
    // Signing out and redirecting to login with an error is a safe fallback.
    await supabase.auth.signOut();
    redirect('/login?message=Profile not found. Please log in again.');
  }

  const isAdmin = ['super_admin', 'admin'].includes(profile.role);

  if (!isAdmin && profile.approval_status !== 'approved') {
    redirect('/pending-approval');
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
