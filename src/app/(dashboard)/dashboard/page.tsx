// src/app/(dashboard)/dashboard/page.tsx
import { readUserSession } from '@/app/(auth)/actions';
import { RoleDashboard } from '@/components/dashboard/role-dashboard';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers'; // Import cookies
import { redirect } from 'next/navigation';


export default async function DashboardPage() {
  const cookieStore = cookies(); // Create the cookie store
  const supabase = createClient(cookieStore); // Pass it to the client
  //const [profile,setProfile] = useState(null)

  const {
    data: { user },
  } = await supabase.auth.getUser();



  if (!user) {
    redirect('/login');
  }
 
    const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
 
    console.log(profile)
   
    

  if (!profile) {
    return redirect('/login?message=Profile not found.');
  }

  return <RoleDashboard userRole={profile?.role} userId={user?.id} />;
}