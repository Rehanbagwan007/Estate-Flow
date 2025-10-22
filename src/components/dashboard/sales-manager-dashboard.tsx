import { createClient } from '@/lib/supabase/server';
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
  Building2
} from 'lucide-react';

interface SalesManagerDashboardProps {
  userId: string;
}

export async function SalesManagerDashboard({ userId }: SalesManagerDashboardProps) {
  const supabase = createClient();

  // Fetch sales manager data
  const [
    salesExecutivesResult,
    leadsResult,
    assignmentsResult,
    performanceResult
  ] = await Promise.all([
    (await supabase).from('profiles').select('*').in('role', ['sales_executive_1', 'sales_executive_2']),
    (await supabase).from('leads').select('*, assigned_to:profiles(*)'),
    (await supabase).from('agent_assignments').select('*, agent:profiles(*)'),
    (await supabase).from('call_logs').select('*, agent:profiles(*)')
  ]);

  const salesExecutives = salesExecutivesResult.data || [];
  const leads = leadsResult.data || [];
  const assignments = assignmentsResult.data || [];
  const performance = performanceResult.data || [];

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

  return (
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
            <CardTitle className="text-sm font-medium">Team Assignments</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignments}</div>
            <p className="text-xs text-muted-foreground">
              {completedAssignments} completed
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
                        Assigned to: {lead.assigned_to ? lead.assigned_to?.first_name : 'Unassigned'}
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common sales management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Assign Leads</div>
                <div className="text-sm text-muted-foreground">Distribute leads to team</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Team Performance</div>
                <div className="text-sm text-muted-foreground">View detailed reports</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Set Targets</div>
                <div className="text-sm text-muted-foreground">Define team goals</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Training</div>
                <div className="text-sm text-muted-foreground">Team development</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
