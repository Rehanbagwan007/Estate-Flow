
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
    assigned_to_profile?: Profile | null;
}

interface SalesManagerDashboardProps {
  userId: string;
}

export function SalesManagerDashboard({ userId }: SalesManagerDashboardProps) {
  const [salesExecutives, setSalesExecutives] = useState<Profile[]>([]);
  const [teamLeads, setTeamLeads] = useState<Lead[]>([]);
  const [teamAssignments, setTeamAssignments] = useState<AgentAssignment[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<CallLog[]>([]);
  const [teamTasks, setTeamTasks] = useState<EnrichedTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [callTarget, setCallTarget] = useState<{ customerId: string; customerPhone: string; customerName: string } | null>(null);
  const [selectedTask, setSelectedTask] = useState<EnrichedTask | null>(null);


  useEffect(() => {
    const supabase = createClient();
    const fetchData = async () => {
        setIsLoading(true);
        // First, get the IDs of the sales executives
        const { data: executives } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, role')
            .in('role', ['sales_executive_1', 'sales_executive_2']);
        
        const executiveIds = executives?.map(e => e.id) || [];
        setSalesExecutives(executives || []);

        if (executiveIds.length > 0) {
            const [
                leadsResult,
                assignmentsResult,
                performanceResult,
                tasksResult,
            ] = await Promise.all([
                supabase.from('leads').select('*, assigned_to:profiles(*)').in('assigned_to', executiveIds),
                supabase.from('agent_assignments').select('*, agent:profiles!agent_assignments_agent_id_fkey(*)').in('agent_id', executiveIds),
                supabase.from('call_logs').select('*, agent:profiles!call_logs_agent_id_fkey(*)').in('agent_id', executiveIds),
                supabase.from('tasks').select('*, property:related_property_id(*, property_media(file_path)), customer:related_customer_id(*), assigned_to_profile:assigned_to(*)').in('assigned_to', executiveIds)
            ]);
            
            setTeamLeads(leadsResult.data || []);
            setTeamAssignments(assignmentsResult.data || []);
            setTeamPerformance(performanceResult.data || []);
            setTeamTasks((tasksResult.data as EnrichedTask[]) || []);
        }
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
  const totalLeads = teamLeads.length;
  const hotLeads = teamLeads.filter(l => l.status === 'Hot').length;
  const assignedLeads = teamLeads.filter(l => l.assigned_to).length;
  const totalAssignments = teamAssignments.length;
  const completedAssignments = teamAssignments.filter(a => a.status === 'completed').length;
  const openTasks = teamTasks.filter(t => t.status !== 'Done').length;


  // Performance by executive
  const executivePerformance = salesExecutives.map(exec => {
    const execLeads = teamLeads.filter(l => l.assigned_to === exec.id);
    const execCalls = teamPerformance.filter(p => p.agent_id === exec.id);
    const execAssignments = teamAssignments.filter(a => a.agent_id === exec.id);
    
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
              <CardTitle className="text-sm font-medium">Team Leads</CardTitle>
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
                {totalLeads > 0 ? Math.round((assignedLeads / totalLeads) * 100) : 0}% of team leads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Tasks</CardTitle>
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamTasks.length}</div>
              <p className="text-xs text-muted-foreground">
                {openTasks} open
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

        {teamTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Team Tasks</CardTitle>
              <CardDescription>All open tasks for your sales executives.</CardDescription>
            </CardHeader>
            <CardContent>
              <TaskList tasks={teamTasks} onCall={handleCallClick} onTaskSelect={setSelectedTask} />
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

      </div>
    </>
  );
}
