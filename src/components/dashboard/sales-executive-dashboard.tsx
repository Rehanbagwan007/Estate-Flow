import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Phone, 
  Calendar, 
  Target,
  TrendingUp,
  CheckCircle,
  Clock
} from 'lucide-react';

interface SalesExecutiveDashboardProps {
  userId: string;
}

export async function SalesExecutiveDashboard({ userId }: SalesExecutiveDashboardProps) {
  const supabase = createClient();

  // Fetch sales executive data
  const [
    myAssignmentsResult,
    myLeadsResult,
    myCallsResult,
    myAppointmentsResult
  ] = await Promise.all([
    (await supabase).from('agent_assignments').select('*, customer:profiles(*)').eq('agent_id', userId),
    (await supabase).from('leads').select('*').eq('assigned_to', userId),
    (await supabase).from('call_logs').select('*, customer:profiles(*)').eq('agent_id', userId),
    (await supabase).from('appointments').select('*, customer:profiles(*)').eq('agent_id', userId)
  ]);

  const myAssignments = myAssignmentsResult.data || [];
  const myLeads = myLeadsResult.data || [];
  const myCalls = myCallsResult.data || [];
  const myAppointments = myAppointmentsResult.data || [];

  // Calculate metrics
  const totalAssignments = myAssignments.length;
  const completedAssignments = myAssignments.filter(a => a.status === 'completed').length;
  const activeAssignments = myAssignments.filter(a => a.status === 'in_progress').length;
  const totalLeads = myLeads.length;
  const hotLeads = myLeads.filter(l => l.status === 'Hot').length;
  const totalCalls = myCalls.length;
  const completedCalls = myCalls.filter(c => c.call_status === 'completed').length;
  const upcomingAppointments = myAppointments.filter(a => 
    new Date(a.scheduled_at) > new Date() && a.status === 'scheduled'
  ).length;

  return (
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
            <CardTitle className="text-sm font-medium">My Leads</CardTitle>
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
            <div className="text-2xl font-bold">{myAppointments.length}</div>
            <p className="text-xs text-muted-foreground">
              {upcomingAppointments} upcoming
            </p>
          </CardContent>
        </Card>
      </div>

      {/* My Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>My Customer Assignments</CardTitle>
          <CardDescription>
            Customers assigned to you for follow-up
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myAssignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No assignments yet
            </div>
          ) : (
            <div className="space-y-4">
              {myAssignments.slice(0, 5).map((assignment) => (
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
                        <Badge variant="outline">{assignment.assignment_type}</Badge>
                        <Badge variant="outline" className={
                          assignment.priority === 'high' ? 'bg-red-100 text-red-800' :
                          assignment.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }>
                          {assignment.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="outline">{assignment.status}</Badge>
                    <Button size="sm" variant="outline">
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Leads */}
      <Card>
        <CardHeader>
          <CardTitle>My Leads</CardTitle>
          <CardDescription>
            Leads assigned to you for follow-up
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No leads assigned yet
            </div>
          ) : (
            <div className="space-y-4">
              {myLeads.slice(0, 5).map((lead) => (
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
                      <p className="text-sm text-muted-foreground">{lead.phone}</p>
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
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>
            Scheduled meetings with customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No appointments scheduled
            </div>
          ) : (
            <div className="space-y-4">
              {myAppointments
                .filter(a => new Date(a.scheduled_at) > new Date())
                .slice(0, 5)
                .map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        Meeting with {appointment.customer?.first_name} {appointment.customer?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(appointment.scheduled_at).toLocaleString()}
                      </p>
                      {appointment.location && (
                        <p className="text-sm text-muted-foreground">
                          Location: {appointment.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="outline">{appointment.status}</Badge>
                    <Button size="sm" variant="outline">
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>
              Your sales performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Assignment Completion</span>
                <span className="text-lg font-bold text-green-600">
                  {totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Call Success Rate</span>
                <span className="text-lg font-bold">
                  {totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Hot Leads Ratio</span>
                <span className="text-lg font-bold">
                  {totalLeads > 0 ? Math.round((hotLeads / totalLeads) * 100) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common sales executive tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Phone className="h-4 w-4 mr-2" />
                Make Customer Call
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle className="h-4 w-4 mr-2" />
                Update Lead Status
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Performance
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
