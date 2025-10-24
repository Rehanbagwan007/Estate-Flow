
'use client';

import { createClient } from '@/lib/supabase/client';
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
  BarChart3,
  ListTodo
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Profile, Property, Lead, CallLog, Appointment, PropertyInterest, Task } from '@/lib/types';
import { TaskList } from '../tasks/task-list';
import { TaskDetailsDialog } from '../tasks/task-details-dialog';
import { ExotelCallInterface } from '../calls/exotel-call-interface';

interface EnrichedTask extends Task {
    property?: (Property & { property_media?: { file_path: string }[] }) | null;
    customer?: Profile | null;
}

interface SuperAdminDashboardProps {
  userId: string;
}

export function SuperAdminDashboard({ userId }: SuperAdminDashboardProps) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [propertyInterests, setPropertyInterests] = useState<PropertyInterest[]>([]);
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [callTarget, setCallTarget] = useState<{ customerId: string; customerPhone: string; customerName: string } | null>(null);
  const [selectedTask, setSelectedTask] = useState<EnrichedTask | null>(null);


  useEffect(() => {
    const supabase = createClient();
    const fetchData = async () => {
      setIsLoading(true);
      const [
        usersResult,
        propertiesResult,
        leadsResult,
        callLogsResult,
        appointmentsResult,
        propertyInterestsResult,
        tasksResult
      ] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('properties').select('*'),
        supabase.from('leads').select('*'),
        supabase.from('call_logs').select('*'),
        supabase.from('appointments').select('*'),
        supabase.from('property_interests').select('*'),
        supabase.from('tasks').select('*, property:related_property_id(*, property_media(file_path)), customer:related_customer_id(*)').eq('assigned_to', userId)
      ]);
      
      setUsers(usersResult.data || []);
      setProperties(propertiesResult.data || []);
      setLeads(leadsResult.data || []);
      setCallLogs(callLogsResult.data || []);
      setAppointments(appointmentsResult.data || []);
      setPropertyInterests(propertyInterestsResult.data || []);
      setTasks(tasksResult.data || []);
      setIsLoading(false);
    };

    fetchData();
  }, [userId]);
  
  const handleCallClick = (target: { customerId: string; customerPhone: string; customerName: string }) => {
    if (target.customerPhone) {
        setCallTarget(target);
    } else {
        alert('Customer phone number is not available.');
    }
  };

  const handleCallEnd = () => {
      setCallTarget(null);
  };


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
  
  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <>
      <TaskDetailsDialog
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onCall={handleCallClick}
      />
      {callTarget && (
        <ExotelCallInterface 
            agentId={userId} 
            callTarget={callTarget}
            onCallEnd={handleCallEnd}
        />
      )}
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
              <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
              <p className="text-xs text-muted-foreground">
                {tasks.filter(t => t.status !== 'Done').length} open
              </p>
            </CardContent>
          </Card>
        </div>
        
        {tasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>Your assigned tasks and follow-ups.</CardDescription>
            </CardHeader>
            <CardContent>
              <TaskList tasks={tasks} onCall={handleCallClick} onTaskSelect={setSelectedTask} />
            </CardContent>
          </Card>
        )}

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
                      {role.replace(/_/g, ' ')}
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
    </>
  );
}
