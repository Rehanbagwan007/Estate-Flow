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

  // The middleware no longer handles redirects. This layout is now the gatekeeper.
  if (!user) {
    return redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, role')
    .eq('id', user.id)
    .single();
  
  // If the profile doesn't exist, this is a critical error. 
  // Log the user out and send them to login with a clear message.
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
