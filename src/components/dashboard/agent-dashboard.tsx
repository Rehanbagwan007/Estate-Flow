import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Phone, 
  Calendar, 
  Building2,
  CheckCircle,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { ExotelCallInterface } from '../calls/exotel-call-interface';

interface AgentDashboardProps {
  userId: string;
}

export async function AgentDashboard({ userId }: AgentDashboardProps) {
  const supabase = createClient();

  // Fetch agent-specific data
  const [
    myAssignmentsResult,
    myAppointmentsResult,
    myCallLogsResult,
    myPropertiesResult
  ] = await Promise.all([
    supabase.from('agent_assignments').select('*, customer:profiles(*), property_interest:property_interests(*)').eq('agent_id', userId),
    supabase.from('appointments').select('*, customer:profiles(*)').eq('agent_id', userId),
    supabase.from('call_logs').select('*, customer:profiles(*)').eq('agent_id', userId),
    supabase.from('properties').select('*').eq('created_by', userId)
  ]);

  const myAssignments = myAssignmentsResult.data || [];
  const myAppointments = myAppointmentsResult.data || [];
  const myCallLogs = myCallLogsResult.data || [];
  const myProperties = myPropertiesResult.data || [];

  // Calculate metrics
  const totalAssignments = myAssignments.length;
  const activeAssignments = myAssignments.filter(a => a.status === 'in_progress').length;
  const upcomingAppointments = myAppointments.filter(a => 
    new Date(a.scheduled_at) > new Date() && a.status === 'scheduled'
  ).length;
  const totalAppointments = myAppointments.length;
  const recentCalls = myCallLogs.filter(c => 
    new Date(c.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;
  const totalProperties = myProperties.length;

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
            <Users className="h-4 w-4 text-muted-foreground" />
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProperties}</div>
            <p className="text-xs text-muted-foreground">
              Listed by me
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Exotel Call Interface */}
      <ExotelCallInterface agentId={userId} />

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
                    <Button size="sm" variant="outline">
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
