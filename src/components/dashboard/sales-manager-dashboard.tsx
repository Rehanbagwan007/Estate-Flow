
'use client';

import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  TrendingUp, 
  Target,
  Award,
  BarChart3,
  UserCheck,
  Building2,
  ListTodo
} from 'lucide-react';
import type { Profile, Lead, AgentAssignment, CallLog, Task, Property } from '@/lib/types';
import { useEffect, useState } from 'react';
import { TaskList } from '../tasks/task-list';
import { TaskDetailsDialog } from '../tasks/task-details-dialog';
import { ExotelCallInterface } from '../calls/exotel-call-interface';

interface EnrichedTask extends Task {
    property?: (Property & { property_media?: { file_path: string }[] }) | null;
    customer?: Profile | null;
}

interface SalesManagerDashboardProps {
  userId: string;
}

export function SalesManagerDashboard({ userId }: SalesManagerDashboardProps) {
  const [salesExecutives, setSalesExecutives] = useState<Profile[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [assignments, setAssignments] = useState<AgentAssignment[]>([]);
  const [performance, setPerformance] = useState<CallLog[]>([]);
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [callTarget, setCallTarget] = useState<{ customerId: string; customerPhone: string; customerName: string } | null>(null);
  const [selectedTask, setSelectedTask] = useState<EnrichedTask | null>(null);


  useEffect(() => {
    const supabase = createClient();
    const fetchData = async () => {
        setIsLoading(true);
        const [
            salesExecutivesResult,
            leadsResult,
            assignmentsResult,
            performanceResult,
            tasksResult,
        ] = await Promise.all([
            supabase.from('profiles').select('*').in('role', ['sales_executive_1', 'sales_executive_2']),
            supabase.from('leads').select('*, assigned_to:profiles(*)'),
            supabase.from('agent_assignments').select('*, agent:profiles(*)'),
            supabase.from('call_logs').select('*, agent:profiles(*)'),
            supabase.from('tasks').select('*, property:related_property_id(*, property_media(file_path)), customer:related_customer_id(*)').eq('assigned_to', userId)
        ]);

        setSalesExecutives(salesExecutivesResult.data || []);
        setLeads(leadsResult.data || []);
        setAssignments(assignmentsResult.data || []);
        setPerformance(performanceResult.data || []);
        setTasks(tasksResult.data || []);
        setIsLoading(false);
    }
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
  const totalLeads = leads.length;
  const hotLeads = leads.filter(l => l.status === 'Hot').length;
  const assignedLeads = leads.filter(l => l.assigned_to).length;
  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter(a => a.status === 'completed').length;

  // Performance by executive
  const executivePerformance = salesExecutives.map(exec => {
    const execLeads = leads.filter(l => l.assigned_to === exec.id);
    const execCalls = performance.filter(p => p.agent_id === exec.id);
    const execAssignments = assignments.filter(a => a.agent_id === exec.id);
    
    return {
      id: exec.id,
      name: `${exec.first_name} ${exec.last_name}`,
      leads: execLeads.length,
      calls: execCalls.length,
      assignments: execAssignments.length,
      completed: execAssignments.filter(a => a.status === 'completed').length
    };
  });
  
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
          <h1 className="text-3xl font-bold tracking-tight">Sales Manager Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor sales team performance and manage leads
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
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
              <CardTitle className="text-sm font-medium">Assigned Leads</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignedLeads}</div>
              <p className="text-xs text-muted-foreground">
                {totalLeads > 0 ? Math.round((assignedLeads / totalLeads) * 100) : 0}% assigned
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Performance</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Completion rate
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

        {/* Sales Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Team Performance</CardTitle>
            <CardDescription>
              Individual performance metrics for sales executives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {executivePerformance.map((exec) => (
                <div key={exec.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {exec.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{exec.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {exec.leads} leads • {exec.calls} calls • {exec.assignments} assignments
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {exec.assignments > 0 ? Math.round((exec.completed / exec.assignments) * 100) : 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">Completion</p>
                    </div>
                    <Badge variant="outline" className={
                      exec.completed >= exec.assignments * 0.8 ? 'bg-green-100 text-green-800' :
                      exec.completed >= exec.assignments * 0.6 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {exec.completed >= exec.assignments * 0.8 ? 'Excellent' :
                      exec.completed >= exec.assignments * 0.6 ? 'Good' : 'Needs Improvement'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
            <CardDescription>
              Latest lead generation and assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No leads available
              </div>
            ) : (
              <div className="space-y-4">
                {leads.slice(0, 5).map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {lead.first_name[0]}{lead.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{lead.first_name} {lead.last_name}</p>
                        <p className="text-sm text-muted-foreground">{lead.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Assigned to: {lead.assigned_to ? (lead.assigned_to as any)?.first_name : 'Unassigned'}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant="outline" className={
                        lead.status === 'Hot' ? 'bg-red-100 text-red-800' :
                        lead.status === 'Warm' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }>
                        {lead.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        Assign
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
