import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building2, 
  Phone, 
  Calendar, 
  TrendingUp, 
  CheckCircle,
  Clock,
  UserPlus,
  Building
} from 'lucide-react';
import { cookies } from 'next/headers';

interface AdminDashboardProps {
  userId: string;
}

export async function AdminDashboard({ userId }: AdminDashboardProps) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Fetch admin-specific data
  const [
    pendingUsersResult,
    propertiesResult,
    propertyInterestsResult,
    appointmentsResult,
    callLogsResult
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('approval_status', 'pending'),
    supabase.from('properties').select('*'),
    supabase.from('property_interests').select('*, property:properties(*), customer:profiles(*)'),
    supabase.from('appointments').select('*, agent:profiles(*), customer:profiles(*)'),
    supabase.from('call_logs').select('*, agent:profiles(*), customer:profiles(*)')
  ]);

  const pendingUsers = pendingUsersResult.data || [];
  const properties = propertiesResult.data || [];
  const propertyInterests = propertyInterestsResult.data || [];
  const appointments = appointmentsResult.data || [];
  const callLogs = callLogsResult.data || [];

  // Calculate metrics
  const totalProperties = properties.length;
  const availableProperties = properties.filter(p => p.status === 'Available').length;
  const pendingInterests = propertyInterests.filter(i => i.status === 'pending').length;
  const totalInterests = propertyInterests.length;
  const upcomingAppointments = appointments.filter(a => 
    new Date(a.scheduled_at) > new Date() && a.status === 'scheduled'
  ).length;
  const totalAppointments = appointments.length;
  const recentCalls = callLogs.filter(c => 
    new Date(c.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage properties, users, and oversee operations
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Users awaiting approval
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
            <CardTitle className="text-sm font-medium">Property Interests</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
      </div>

      {/* Pending User Approvals */}
      <Card>
        <CardHeader>
          <CardTitle>Pending User Approvals</CardTitle>
          <CardDescription>
            Users waiting for account approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending approvals
            </div>
          ) : (
            <div className="space-y-4">
              {pendingUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user.first_name} {user.last_name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <Badge variant="outline" className="mt-1">
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline">
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
              {pendingUsers.length > 5 && (
                <div className="text-center">
                  <Button variant="outline">
                    View All ({pendingUsers.length} total)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Property Interests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Property Interests</CardTitle>
          <CardDescription>
            Latest customer interest expressions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {propertyInterests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No property interests yet
            </div>
          ) : (
            <div className="space-y-4">
              {propertyInterests.slice(0, 5).map((interest) => (
                <div key={interest.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Building className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{interest.property?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Interest by {interest.customer?.first_name} {interest.customer?.last_name}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {interest.interest_level}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      Assign Agent
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
            Scheduled meetings and property visits
          </CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No appointments scheduled
            </div>
          ) : (
            <div className="space-y-4">
              {appointments
                .filter(a => new Date(a.scheduled_at) > new Date())
                .slice(0, 5)
                .map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {appointment.customer?.first_name} {appointment.customer?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(appointment.scheduled_at).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Agent: {appointment.agent?.first_name} {appointment.agent?.last_name}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {appointment.status}
                  </Badge>
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
            Common administrative tasks
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
                <div className="font-medium">Manage Users</div>
                <div className="text-sm text-muted-foreground">Approve/reject users</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Assign Agents</div>
                <div className="text-sm text-muted-foreground">Assign to interests</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4">
              <div className="text-left">
                <div className="font-medium">View Reports</div>
                <div className="text-sm text-muted-foreground">Analytics & insights</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
