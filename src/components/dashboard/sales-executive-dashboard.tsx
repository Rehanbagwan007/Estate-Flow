
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
import type { AgentAssignment, Appointment, CallLog, Profile, Lead, Task, Property } from '@/lib/types';
import { useEffect, useState } from 'react';
import { TaskList } from '../tasks/task-list';
import { TaskDetailsDialog } from '../tasks/task-details-dialog';

interface EnrichedAssignment extends AgentAssignment {
    customer: Profile;
}

interface EnrichedTask extends Task {
    property?: (Property & { property_media?: { file_path: string }[] }) | null;
    customer?: Profile | null;
}

interface SalesExecutiveDashboardProps {
  userId: string;
}

export function SalesExecutiveDashboard({ userId }: SalesExecutiveDashboardProps) {
    const [assignments, setAssignments] = useState<EnrichedAssignment[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [callLogs, setCallLogs] = useState<CallLog[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [tasks, setTasks] = useState<EnrichedTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [callTarget, setCallTarget] = useState<{ customerId: string; customerPhone: string; customerName: string } | null>(null);
    const [selectedTask, setSelectedTask] = useState<EnrichedTask | null>(null);

    useEffect(() => {
        const supabase = createClient();
        const fetchData = async () => {
            setIsLoading(true);
            const [
                assignmentsResult,
                appointmentsResult,
                callLogsResult,
                leadsResult,
                tasksResult
            ] = await Promise.all([
                supabase.from('agent_assignments').select('*, customer:profiles(*)').eq('agent_id', userId),
                supabase.from('appointments').select('*, customer:profiles(*)').eq('agent_id', userId),
                supabase.from('call_logs').select('*, customer:profiles(*)').eq('agent_id', userId),
                supabase.from('leads').select('*').eq('assigned_to', userId),
                supabase.from('tasks')
                    .select(`
                        *,
                        property:related_property_id(*, property_media(file_path)),
                        customer:related_customer_id(*)
                    `)
                    .eq('assigned_to', userId)
                    .order('created_at', { ascending: false }),
            ]);

            setAssignments((assignmentsResult.data as EnrichedAssignment[]) || []);
            setAppointments(appointmentsResult.data || []);
            setCallLogs(callLogsResult.data || []);
            setLeads(leadsResult.data || []);
            
            const enrichedTasks = (tasksResult.data || []).map((task: any) => ({
                ...task,
                property: task.property,
                customer: task.customer,
            })) as EnrichedTask[];
            setTasks(enrichedTasks);

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

    // Calculate metrics
    const totalAssignments = assignments.length;
    const activeAssignments = assignments.filter(a => a.status === 'in_progress' || a.status === 'assigned').length;
    const totalLeads = leads.length;
    const hotLeads = leads.filter(l => l.status === 'Hot').length;
    const totalCalls = callLogs.length;
    const completedCalls = callLogs.filter(c => c.call_status === 'completed').length;
    const upcomingAppointments = appointments.filter(a => 
        new Date(a.scheduled_at) > new Date() && a.status === 'scheduled'
    ).length;
    const openTasks = tasks.filter(t => t.status !== 'Done').length;


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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Executive Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your leads, follow-ups, and customer interactions
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
              <CardTitle className="text-sm font-medium">Calls Made</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCalls}</div>
              <p className="text-xs text-muted-foreground">
                {completedCalls} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointments.length}</div>
              <p className="text-xs text-muted-foreground">
                {upcomingAppointments} upcoming
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Exotel Call Interface */}
        {callTarget && (
          <ExotelCallInterface 
            agentId={userId} 
            callTarget={callTarget}
            onCallEnd={handleCallEnd}
          />
        )}

          <div className="grid gap-6">
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
                      <TaskList tasks={tasks} onCall={handleCallClick} onTaskSelect={setSelectedTask} />
                  )}
                  </CardContent>
              </Card>
          </div>
      </div>
    </>
  );
}
