
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Profile, Task, Lead, CallLog, Appointment } from '@/lib/types';
import { ListTodo, Users, Phone, Calendar, Star } from 'lucide-react';
import { Pie, PieChart, Cell, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useMemo } from 'react';
import { format } from 'date-fns';

interface PerformanceData {
    profile: Profile;
    tasks: Task[];
    leads: Lead[];
    calls: CallLog[];
    appointments: Appointment[];
}

interface UserPerformanceDashboardProps {
  data: PerformanceData;
}

const leadChartConfig = {
  Hot: { label: 'Hot', color: 'hsl(var(--chart-1))' },
  Warm: { label: 'Warm', color: 'hsl(var(--chart-2))' },
  Cold: { label: 'Cold', color: 'hsl(var(--chart-3))' },
};

const taskChartConfig = {
  count: { label: 'Tasks', color: 'hsl(var(--chart-1))' },
};


export function UserPerformanceDashboard({ data }: UserPerformanceDashboardProps) {
  const { profile, tasks, leads, calls, appointments } = data;

  const kpis = {
    tasksCompleted: tasks.filter(t => t.status === 'Done').length,
    activeLeads: leads.filter(l => ['Hot', 'Warm'].includes(l.status)).length,
    totalCalls: calls.length,
    meetingsHeld: appointments.filter(a => new Date(a.scheduled_at) < new Date()).length
  };
  
  const leadStatusData = useMemo(() => {
    const statusCounts = leads.reduce((acc, lead) => {
        const status = lead.status as keyof typeof leadChartConfig;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<keyof typeof leadChartConfig, number>);
    
    return Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        fill: leadChartConfig[status as keyof typeof leadChartConfig]?.color,
    }));
  }, [leads]);

  const monthlyTaskData = useMemo(() => {
    const monthCounts = tasks.reduce((acc, task) => {
        if (task.status === 'Done') {
            const month = format(new Date(task.updated_at || task.created_at), 'MMM');
            acc[month] = (acc[month] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    // Ensure we have data for the last 6 months even if count is 0
    const last6Months = Array.from({length: 6}, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return format(d, 'MMM');
    }).reverse();

    return last6Months.map(month => ({
        month,
        count: monthCounts[month] || 0
    }));

  }, [tasks]);


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance: {profile.first_name} {profile.last_name}</h1>
        <p className="text-muted-foreground">
          Detailed overview of this team member's activity and performance.
        </p>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.tasksCompleted}</div>
            <p className="text-xs text-muted-foreground">out of {tasks.length} total tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.activeLeads}</div>
            <p className="text-xs text-muted-foreground">out of {leads.length} total leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls Made</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalCalls}</div>
            <p className="text-xs text-muted-foreground">all-time calls</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meetings Held</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.meetingsHeld}</div>
            <p className="text-xs text-muted-foreground">out of {appointments.length} scheduled</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
       <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Lead Conversion Status</CardTitle>
              <CardDescription>Distribution of the user's assigned leads.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={leadChartConfig} className="mx-auto aspect-square max-h-[250px]">
                    <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="count" hideLabel />} />
                        <Pie data={leadStatusData} dataKey="count" nameKey="status" innerRadius={60}>
                            {leadStatusData.map((entry) => (
                                <Cell key={entry.status} fill={entry.fill} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
          </Card>
          <Card>
             <CardHeader>
                <CardTitle>Monthly Task Completion</CardTitle>
                <CardDescription>Tasks completed over the last 6 months.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={taskChartConfig} className="max-h-[250px] w-full">
                    <BarChart data={monthlyTaskData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Bar dataKey="count" fill="var(--color-count)" radius={8} />
                    </BarChart>
                </ChartContainer>
              </CardContent>
          </Card>
       </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>Latest tasks assigned to {profile.first_name}.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">{task.property?.title || 'General Task'}</p>
                  </div>
                  <Badge variant={task.status === 'Done' ? 'secondary' : 'default'}>{task.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
            <CardDescription>Latest leads assigned to {profile.first_name}.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leads.slice(0, 5).map(lead => (
                <div key={lead.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{lead.first_name} {lead.last_name}</p>
                    <p className="text-sm text-muted-foreground">{lead.email}</p>
                  </div>
                  <Badge variant={lead.status === 'Hot' ? 'destructive' : 'secondary'}>{lead.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
