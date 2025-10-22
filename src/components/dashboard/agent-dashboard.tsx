import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Phone, 
  Calendar, 
  Building2,
  Clock,
  CheckCircle,
  TrendingUp,
  MapPin
} from 'lucide-react';

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
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{appointment.location}</span>
                        </div>
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

      {/* Recent Call Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Call Activity</CardTitle>
          <CardDescription>
            Your recent customer calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myCallLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No calls made yet
            </div>
          ) : (
            <div className="space-y-4">
              {myCallLogs.slice(0, 5).map((call) => (
                <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Phone className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        Call with {call.customer?.first_name} {call.customer?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(call.created_at).toLocaleString()}
                      </p>
                      {call.duration_seconds && (
                        <p className="text-sm text-muted-foreground">
                          Duration: {Math.floor(call.duration_seconds / 60)}m {call.duration_seconds % 60}s
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="outline" className={
                      call.call_status === 'completed' ? 'bg-green-100 text-green-800' :
                      call.call_status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {call.call_status}
                    </Badge>
                    {call.recording_url && (
                      <Button size="sm" variant="outline">
                        Play Recording
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Properties */}
      <Card>
        <CardHeader>
          <CardTitle>My Property Listings</CardTitle>
          <CardDescription>
            Properties you've listed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myProperties.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No properties listed yet
            </div>
          ) : (
            <div className="space-y-4">
              {myProperties.slice(0, 5).map((property) => (
                <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{property.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {property.city}, {property.state}
                      </p>
                      <p className="text-sm font-medium">₹{property.price.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="outline">{property.status}</Badge>
                    <Button size="sm" variant="outline">
                      Edit
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
            Common agent tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Add Property</div>
                <div className="text-sm text-muted-foreground">Create new listing</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Call Customer</div>
                <div className="text-sm text-muted-foreground">Make outbound call</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Schedule Meeting</div>
                <div className="text-sm text-muted-foreground">Book appointment</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4">
              <div className="text-left">
                <div className="font-medium">View Reports</div>
                <div className="text-sm text-muted-foreground">My performance</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
