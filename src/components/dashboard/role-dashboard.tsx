import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SuperAdminDashboard } from './super-admin-dashboard';
import { AdminDashboard } from './admin-dashboard';
import { AgentDashboard } from './agent-dashboard';
import { CustomerDashboard } from './customer-dashboard';
import { CallerDashboard } from './caller-dashboard';
import { SalesManagerDashboard } from './sales-manager-dashboard';
import { SalesExecutiveDashboard } from './sales-executive-dashboard';

interface RoleDashboardProps {
  userRole: string;
  userId: string;
}

export async function RoleDashboard({ userRole, userId }: RoleDashboardProps) {
  const supabase = createClient();

  switch (userRole) {
    case 'super_admin':
      return <SuperAdminDashboard userId={userId} />;
    case 'admin':
      return <AdminDashboard userId={userId} />;
    case 'agent':
      return <AgentDashboard userId={userId} />;
    case 'caller_1':
    case 'caller_2':
      return <CallerDashboard userId={userId} />;
    case 'sales_manager':
      return <SalesManagerDashboard userId={userId} />;
    case 'sales_executive_1':
    case 'sales_executive_2':
      return <SalesExecutiveDashboard userId={userId} />;
    case 'customer':
      return <CustomerDashboard userId={userId} />;
    default:
      redirect('/login');
  }
}
