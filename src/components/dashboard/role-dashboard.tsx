import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SuperAdminDashboard } from './super-admin-dashboard';
import { AdminDashboard } from './admin-dashboard';
import { AgentDashboard } from './agent-dashboard';
import { CustomerDashboard } from './customer-dashboard';
import { CallerDashboard } from './caller-dashboard';
import { SalesManagerDashboard } from './sales-manager-dashboard';
import { SalesExecutiveDashboard } from './sales-executive-dashboard';
import type { EnrichedProperty, EnrichedInterest, EnrichedAppointment } from './customer-dashboard'
import type { Profile, Property, PropertyInterest, Appointment, CallLog } from '@/lib/types';

interface RoleDashboardProps {
  userRole: string;
  userId: string;
}

interface EnrichedInterestForAdmin extends PropertyInterest {
    property: Property | null;
    customer: Profile | null;
}

export async function RoleDashboard({ userRole, userId }: RoleDashboardProps) {
  const supabase = createClient();

  switch (userRole) {
    case 'super_admin':
      return <SuperAdminDashboard userId={userId} />;
    case 'admin':
      const [
        pendingUsersResult,
        propertiesResult,
        propertyInterestsResult,
        appointmentsResult,
        callLogsResult
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('approval_status', 'pending'),
        supabase.from('properties').select('*'),
        supabase.from('property_interests').select('*, property:properties(*), customer:profiles(*)'),
        supabase.from('appointments').select('*, agent:profiles(*), customer:profiles(*)'),
        supabase.from('call_logs').select('*, agent:profiles(*), customer:profiles(*)')
      ]);
      return <AdminDashboard 
        userId={userId}
        initialPendingUsers={pendingUsersResult.data || []}
        initialProperties={propertiesResult.data || []}
        initialPropertyInterests={(propertyInterestsResult.data as EnrichedInterestForAdmin[]) || []}
        initialAppointments={appointmentsResult.data || []}
        initialCallLogs={callLogsResult.data || []}
        />;
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
      const [
        propertiesResultCust,
        myInterestsResult,
        myAppointmentsResult
      ] = await Promise.all([
        supabase.from('properties').select('*, property_media(*)').eq('status', 'Available'),
        supabase.from('property_interests').select('*, property:properties(*)').eq('customer_id', userId),
        supabase.from('appointments').select('*, agent:profiles(*)').eq('customer_id', userId)
      ]);

      return <CustomerDashboard 
        userId={userId} 
        initialProperties={(propertiesResultCust.data as EnrichedProperty[]) || []}
        initialMyInterests={(myInterestsResult.data as EnrichedInterest[]) || []}
        initialMyAppointments={(myAppointmentsResult.data as EnrichedAppointment[]) || []}
      />;
    default:
      // Fallback for any unknown or unhandled roles
      console.warn(`Unhandled user role: ${userRole}. Redirecting to login.`);
      redirect('/login');
  }
}
