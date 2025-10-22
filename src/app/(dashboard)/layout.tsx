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
  
  if (profileError || !profile) {
    // This can happen in a race condition right after signup.
    // Instead of redirecting here (which causes loops), we'll let the 
    // dashboard page handle the redirect to the pending-approval page.
    // This prevents a layout-vs-middleware conflict.
    return redirect('/pending-approval');
  }

  // The conditional redirect for pending customers is now handled in the dashboard page itself.
  // This layout is now only responsible for providing the structure.

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
