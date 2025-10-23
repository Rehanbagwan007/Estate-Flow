import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SuperAdminDashboard } from '@/components/dashboard/super-admin-dashboard';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { AgentDashboard } from '@/components/dashboard/agent-dashboard';
import { CustomerDashboard } from '@/components/dashboard/customer-dashboard';
import { CallerDashboard } from '@/components/dashboard/caller-dashboard';
import { SalesManagerDashboard } from '@/components/dashboard/sales-manager-dashboard';
import { SalesExecutiveDashboard } from '@/components/dashboard/sales-executive-dashboard';

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The layout already handles the redirect if there is no user.
  if (!user) {
    // This should theoretically not be reached because of the layout's protection
    return redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // The layout has also handled the case of a missing profile.
  if (!profile) {
    // This should also not be reached
    await supabase.auth.signOut();
    return redirect('/login?message=Profile not found. Please log in again.');
  }

  const renderDashboard = () => {
    switch (profile.role) {
      case 'super_admin':
        return <SuperAdminDashboard userId={user.id} />;
      case 'admin':
        return <AdminDashboard userId={user.id} />;
      case 'agent':
        return <AgentDashboard userId={user.id} />;
      case 'caller_1':
      case 'caller_2':
        return <CallerDashboard userId={user.id} />;
      case 'sales_manager':
        return <SalesManagerDashboard userId={user.id} />;
      case 'sales_executive_1':
      case 'sales_executive_2':
        return <SalesExecutiveDashboard userId={user.id} />;
      case 'customer':
        return <CustomerDashboard userId={user.id} />;
      default:
        console.warn(`Unhandled user role: ${profile.role}. Redirecting to login.`);
        redirect('/login');
        return null; // Should be unreachable
    }
  };

  return <>{renderDashboard()}</>;
}
