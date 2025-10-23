
'use client';

import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Phone, 
  Calendar, 
  Target,
  ListTodo
} from 'lucide-react';
import { ExotelCallInterface } from '../calls/exotel-call-interface';
import type { AgentAssignment, Appointment, CallLog, Profile, PropertyInterest, Task } from '@/lib/types';
import { useEffect, useState } from 'react';
import { TaskList } from '../tasks/task-list';

interface EnrichedAssignment extends AgentAssignment {
    customer: Profile;
    property_interest: PropertyInterest & {
        property: {
            title: string;
        } | null
    } | null;
}

interface AgentDashboardProps {
  userId: string;
}

export function AgentDashboard({ userId }: AgentDashboardProps) {
  const [assignments, setAssignments] = useState<EnrichedAssignment[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for the call interface
  const [callTarget, setCallTarget] = useState<{ customerId: string; customerPhone: string; customerName: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const fetchData = async () => {
      setIsLoading(true);
      const [
        assignmentsResult,
        appointmentsResult,
        callLogsResult,
        tasksResult,
      ] = await Promise.all([
        supabase
            .from('agent_assignments')
            .select(`
                *, 
                customer:profiles(*), 
                property_interest:property_interests(
                    *,
                    property:properties(title)
                )
            `)
            .eq('agent_id', userId)
            .order('created_at', { ascending: false }),
        supabase.from('appointments').select('*, customer:profiles(*)').eq('agent_id', userId),
        supabase.from('call_logs').select('*').eq('agent_id', userId),
        supabase.from('tasks').select('*').eq('assigned_to', userId).order('created_at', { ascending: false }),
      ]);

      setAssignments((assignmentsResult.data as EnrichedAssignment[]) || []);
      setAppointments(appointmentsResult.data || []);
      setCallLogs(callLogsResult.data || []);
      setTasks(tasksResult.data || []);
      setIsLoading(false);
    };

    fetchData();
  }, [userId]);
  
  const handleCallClick = (assignment: EnrichedAssignment) => {
    if (assignment.customer?.phone) {
        setCallTarget({
            customerId: assignment.customer_id,
            customerPhone: assignment.customer.phone,
            customerName: `${assignment.customer.first_name} ${assignment.customer.last_name}`
        });
    } else {
        alert('Customer phone number is not available.');
    }
  };

  const handleCallEnd = () => {
    setCallTarget(null);
    // Optionally refetch call logs here
  };

  // Calculate metrics
  const totalAssignments = assignments.length;
  const activeAssignments = assignments.filter(a => a.status === 'in_progress' || a.status === 'assigned').length;
  const upcomingAppointments = appointments.filter(a => 
    new Date(a.scheduled_at) > new Date() && a.status === 'scheduled'
  ).length;
  const totalAppointments = appointments.length;
  const recentCalls = callLogs.filter(c => 
    new Date(c.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;
  const openTasks = tasks.filter(t => t.status !== 'Done').length;


  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agent Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your assigned customers and property listings
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Assignments</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignments}</div>
            <p className="text-xs text-muted-foreground">
              {activeAssignments} active
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
              {openTasks} open
            </p>
          </CardContent>
        </Card>

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
            <CardTitle className="text-sm font-medium">Recent Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentCalls}</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Exotel Call Interface */}
      <ExotelCallInterface 
        agentId={userId} 
        callTarget={callTarget}
        onCallEnd={handleCallEnd}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* My Tasks */}
        <Card>
            <CardHeader>
            <CardTitle>My Tasks</CardTitle>
            <CardDescription>
                Your assigned tasks and follow-ups.
            </CardDescription>
            </CardHeader>
            <CardContent>
            {tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                No tasks assigned yet.
                </div>
            ) : (
                <TaskList tasks={tasks.slice(0, 5)} />
            )}
            </CardContent>
        </Card>

        {/* My Assignments */}
        <Card>
            <CardHeader>
            <CardTitle>My Customer Assignments</CardTitle>
            <CardDescription>
                Customers assigned to you for follow-up
            </CardDescription>
            </CardHeader>
            <CardContent>
            {assignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                No assignments yet
                </div>
            ) : (
                <div className="space-y-4">
                {assignments.slice(0, 5).map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                            {assignment.customer?.first_name?.[0]}{assignment.customer?.last_name?.[0]}
                        </span>
                        </div>
                        <div>
                        <p className="font-medium">
                            {assignment.customer?.first_name} {assignment.customer?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{assignment.customer?.email}</p>
                        <div className="flex gap-2 mt-1">
                            <Badge variant="outline">{assignment.priority} priority</Badge>
                            <Badge variant="secondary">{assignment.status}</Badge>
                        </div>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleCallClick(assignment)}>
                        <Phone className="h-4 w-4 mr-1" />
                        Call
                        </Button>
                        <Button size="sm" variant="ghost">
                         Details
                        </Button>
                    </div>
                    </div>
                ))}
                </div>
            )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

    