import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building2, 
  Phone, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  Activity,
  BarChart3
} from 'lucide-react';

interface SuperAdminDashboardProps {
  userId: string;
}

export async function SuperAdminDashboard({ userId }: SuperAdminDashboardProps) {
  const supabase = createClient();

  // Fetch comprehensive analytics data
  const [
    usersResult,
    propertiesResult,
    leadsResult,
    callLogsResult,
    appointmentsResult,
    propertyInterestsResult
  ] = await Promise.all([
    (await supabase).from('profiles').select('*'),
    (await supabase).from('properties').select('*'),
    (await supabase).from('leads').select('*'),
    (await supabase).from('call_logs').select('*'),
    (await supabase).from('appointments').select('*'),
    (await supabase).from('property_interests').select('*')
  ]);

  const users = usersResult.data || [];
  const properties = propertiesResult.data || [];
  const leads = leadsResult.data || [];
  const callLogs = callLogsResult.data || [];
  const appointments = appointmentsResult.data || [];
  const propertyInterests = propertyInterestsResult.data || [];

  // Calculate analytics
  const totalUsers = users.length;
  const approvedUsers = users.filter(u => u.approval_status === 'approved').length;
  const pendingUsers = users.filter(u => u.approval_status === 'pending').length;
  const totalProperties = properties.length;
  const availableProperties = properties.filter(p => p.status === 'Available').length;
  const totalLeads = leads.length;
  const hotLeads = leads.filter(l => l.status === 'Hot').length;
  const totalCalls = callLogs.length;
  const completedCalls = callLogs.filter(c => c.call_status === 'completed').length;
  const totalAppointments = appointments.length;
  const upcomingAppointments = appointments.filter(a => 
    new Date(a.scheduled_at) > new Date() && a.status === 'scheduled'
  ).length;
  const totalInterests = propertyInterests.length;
  const pendingInterests = propertyInterests.filter(i => i.status === 'pending').length;

  // Role distribution
  const roleDistribution = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Recent activity
  const recentActivities = [
    ...leads.slice(0, 3).map(lead => ({
      type: 'lead',
      message: `New lead: ${lead.first_name} ${lead.last_name}`,
      timestamp: lead.created_at,
      status: lead.status
    })),
    ...propertyInterests.slice(0, 3).map(interest => ({
      type: 'interest',
      message: `Property interest expressed`,
      timestamp: interest.created_at,
      status: interest.status
    })),
    ...callLogs.slice(0, 3).map(call => ({
      type: 'call',
      message: `Call completed`,
      timestamp: call.created_at,
      status: call.call_status
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Complete overview of the EstateFlow CRM system
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {approvedUsers} approved, {pendingUsers} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProperties}</div>
            <p className="text-xs text-muted-foreground">
              {availableProperties} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              {hotLeads} hot leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalls}</div>
            <p className="text-xs text-muted-foreground">
              {completedCalls} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {upcomingAppointments} upcoming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Property Interests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInterests}</div>
            <p className="text-xs text-muted-foreground">
              {pendingInterests} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98%</div>
            <p className="text-xs text-muted-foreground">
              Uptime this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Role Distribution</CardTitle>
            <CardDescription>
              Breakdown of users by role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(roleDistribution).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">
                    {role.replace('_', ' ')}
                  </span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest system activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto p-4">
              <div className="text-left">
                <div className="font-medium">User Management</div>
                <div className="text-sm text-muted-foreground">Approve users</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4">
              <div className="text-left">
                <div className="font-medium">System Settings</div>
                <div className="text-sm text-muted-foreground">Configure integrations</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Analytics</div>
                <div className="text-sm text-muted-foreground">View detailed reports</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Call Recordings</div>
                <div className="text-sm text-muted-foreground">Monitor calls</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
