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

  // The middleware now handles redirecting unauthenticated users.
  // If we reach this point, we can assume a user exists.
  // If for some reason the user doesn't exist, it's a critical error state.
  if (!user) {
    // This should theoretically be unreachable due to middleware.
    // But as a fallback, redirect to login.
    return redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, role')
    .eq('id', user.id)
    .single();
  
  // If the profile doesn't exist after a successful login, this is a critical data issue.
  // Log the user out to prevent further errors and force a clean slate.
  if (!profile) {
    await supabase.auth.signOut();
    return redirect('/login?message=Profile not found. Please log in again.');
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
