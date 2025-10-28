
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
  ListTodo,
  FileText,
  UserCheck
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Profile, Property, Lead, CallLog, Appointment, PropertyInterest, Task, Notification } from '@/lib/types';
import { TaskList } from '../tasks/task-list';
import { TaskDetailsDialog } from '../tasks/task-details-dialog';
import { ExotelCallInterface } from '../calls/exotel-call-interface';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface EnrichedTask extends Task {
    property?: (Property & { property_media?: { file_path: string }[] }) | null;
    customer?: Profile | null;
}

interface EnrichedNotification extends Notification {
    user: Profile | null;
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
  const [notifications, setNotifications] = useState<EnrichedNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [callTarget, setCallTarget] = useState<{ customerId: string; customerPhone: string; customerName: string } | null>(null);
  const [selectedTask, setSelectedTask] = useState<EnrichedTask | null>(null);

  const fetchData = async () => {
    const supabase = createClient();
    setIsLoading(true);
    const [
      usersResult,
      propertiesResult,
      leadsResult,
      callLogsResult,
      appointmentsResult,
      propertyInterestsResult,
      tasksResult,
      notificationsResult
    ] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('properties').select('*'),
      supabase.from('leads').select('*'),
      supabase.from('call_logs').select('*'),
      supabase.from('appointments').select('*'),
      supabase.from('property_interests').select('*'),
      supabase.from('tasks').select('*, property:related_property_id(*, property_media(file_path)), customer:related_customer_id(*)').eq('assigned_to', userId),
      supabase.from('notifications').select('*, user:profiles!notifications_user_id_fkey(*)').order('created_at', { ascending: false }).limit(10),
    ]);
    
    setUsers(usersResult.data || []);
    setProperties(propertiesResult.data || []);
    setLeads(leadsResult.data || []);
    setCallLogs(callLogsResult.data || []);
    setAppointments(appointmentsResult.data || []);
    setPropertyInterests(propertyInterestsResult.data || []);
    setTasks(tasksResult.data || []);
    setNotifications((notificationsResult.data as EnrichedNotification[]) || []);
    setIsLoading(false);
  };

  useEffect(() => {
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

  const handleTaskUpdate = () => {
    setSelectedTask(null);
    fetchData(); // Refetch all data to update the dashboard
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

  const getIconForNotification = (type: Notification['type']) => {
    switch(type) {
      case 'report_submitted': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'task_completed': return <UserCheck className="h-4 w-4 text-green-500" />;
      case 'property_interest': return <Building2 className="h-4 w-4 text-purple-500" />;
      case 'task_assigned': return <ListTodo className="h-4 w-4 text-orange-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  }
  
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
          onUpdate={handleTaskUpdate}
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
              <CardTitle>Recent System Activity</CardTitle>
              <CardDescription>
                Latest notifications from across the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
            {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No recent activities.</div>
            ) : (
                <div className="space-y-4">
                {notifications.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4">
                        <div className="w-8 h-8 flex items-center justify-center">
                            {getIconForNotification(activity.type)}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium leading-none">{activity.title}</p>
                            <p className="text-sm text-muted-foreground">{activity.message}</p>
                        </div>
                        <time className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </time>
                    </div>
                ))}
                </div>
            )}
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
                <Button variant="outline" asChild>
                    <Link href="/admin/users">
                        <Users className="mr-2" /> User Management
                    </Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/admin/settings">
                        <DollarSign className="mr-2" /> Salary Settings
                    </Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link href="#">
                         <BarChart3 className="mr-2" /> View Reports
                    </Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link href="#">
                        <Phone className="mr-2" /> Call Recordings
                    </Link>
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
