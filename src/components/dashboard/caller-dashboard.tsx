import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Volume2
} from 'lucide-react';
import { cookies } from 'next/headers';

interface CallerDashboardProps {
  userId: string;
}

export async function CallerDashboard({ userId }: CallerDashboardProps) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Fetch caller-specific data
  const [
    myCallLogsResult,
    recentCallsResult
  ] = await Promise.all([
    supabase.from('call_logs').select('*, customer:profiles(*)').eq('agent_id', userId),
    supabase.from('call_logs').select('*, customer:profiles(*)').eq('agent_id', userId).order('created_at', { ascending: false }).limit(10)
  ]);

  const myCallLogs = myCallLogsResult.data || [];
  const recentCalls = recentCallsResult.data || [];

  // Calculate metrics
  const totalCalls = myCallLogs.length;
  const completedCalls = myCallLogs.filter(c => c.call_status === 'completed').length;
  const failedCalls = myCallLogs.filter(c => c.call_status === 'failed').length;
  const todayCalls = myCallLogs.filter(c => 
    new Date(c.created_at).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Call Center Dashboard</h1>
        <p className="text-muted-foreground">
          Manage outbound and inbound calls with customers
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalls}</div>
            <p className="text-xs text-muted-foreground">
              All time calls
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Calls</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCalls}</div>
            <p className="text-xs text-muted-foreground">
              {totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Calls</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedCalls}</div>
            <p className="text-xs text-muted-foreground">
              {totalCalls > 0 ? Math.round((failedCalls / totalCalls) * 100) : 0}% failure rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Calls</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCalls}</div>
            <p className="text-xs text-muted-foreground">
              Calls made today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Call Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Make a Call</CardTitle>
          <CardDescription>
            Initiate outbound calls to customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Customer Phone Number</label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Customer Name (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter customer name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Start Call
              </Button>
              <Button variant="outline">
                Import from Leads
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Calls */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Call Activity</CardTitle>
          <CardDescription>
            Your recent call history and recordings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentCalls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No calls made yet
            </div>
          ) : (
            <div className="space-y-4">
              {recentCalls.map((call) => (
                <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {call.customer?.first_name} {call.customer?.last_name}
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
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={
                      call.call_status === 'completed' ? 'bg-green-100 text-green-800' :
                      call.call_status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {call.call_status}
                    </Badge>
                    {call.recording_url && (
                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline">
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Volume2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Call Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Call Performance</CardTitle>
            <CardDescription>
              Your calling statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Success Rate</span>
                <span className="text-lg font-bold text-green-600">
                  {totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Average Call Duration</span>
                <span className="text-lg font-bold">
                  {myCallLogs.length > 0 ? 
                    Math.round(myCallLogs.reduce((acc, call) => acc + (call.duration_seconds || 0), 0) / myCallLogs.length / 60) : 0
                  }m
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Talk Time</span>
                <span className="text-lg font-bold">
                  {Math.round(myCallLogs.reduce((acc, call) => acc + (call.duration_seconds || 0), 0) / 60)}m
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common caller tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Phone className="h-4 w-4 mr-2" />
                Make Outbound Call
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Schedule Follow-up
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Volume2 className="h-4 w-4 mr-2" />
                View Call Recordings
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle className="h-4 w-4 mr-2" />
                Update Lead Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
