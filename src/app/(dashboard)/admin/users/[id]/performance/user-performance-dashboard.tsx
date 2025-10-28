
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Profile, Task, Lead, CallLog, Appointment, PropertyInterest, Property, JobReport, JobReportMedia } from '@/lib/types';
import { ListTodo, Users, Phone, Calendar, Star, Heart, Building2, DollarSign, MessageSquare, FileText, Camera, CheckCircle2, XCircle } from 'lucide-react';
import { Pie, PieChart, Cell, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useMemo, useState, useTransition } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { updateJobReportStatus } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface EnrichedInterest extends PropertyInterest {
    properties: Pick<Property, 'id' | 'title'> | null;
    agent_assignments: {
        profiles: Pick<Profile, 'id' | 'first_name' | 'last_name'> | null;
    }[]
}

interface EnrichedAppointment extends Appointment {
    agent: Pick<Profile, 'id' | 'first_name' | 'last_name'> | null;
    property: { title: string | null } | null
}

interface EnrichedJobReport extends JobReport {
    job_report_media: JobReportMedia[];
}

interface PerformanceData {
    profile: Profile;
    tasks: Task[];
    leads: Lead[];
    calls: CallLog[];
    appointments: EnrichedAppointment[];
    interests: EnrichedInterest[];
    jobReports: EnrichedJobReport[];
    salaryParameters: { [key: string]: number };
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

const CustomerActivityDashboard = ({ profile, interests, appointments }: { profile: Profile, interests: EnrichedInterest[], appointments: EnrichedAppointment[] }) => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Customer Activity: {profile.first_name} {profile.last_name}</h1>
                <p className="text-muted-foreground">
                Overview of the customer's interests and appointments.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Interests</CardTitle>
                        <Heart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{interests.length}</div>
                        <p className="text-xs text-muted-foreground">properties expressed interest in</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{appointments.length}</div>
                        <p className="text-xs text-muted-foreground">meetings scheduled</p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Property Interests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                        {interests.length === 0 ? <p className="text-sm text-muted-foreground">No property interests found.</p> : interests.map(interest => {
                            const agent = interest.agent_assignments[0]?.profiles;
                            return (
                                <div key={interest.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <Link href={`/properties/${interest.properties?.id}`} className="font-medium hover:underline">
                                            {interest.properties?.title || 'Unknown Property'}
                                        </Link>
                                        <p className="text-xs text-muted-foreground">
                                            Assigned to: {agent ? 
                                                <Link href={`/admin/users/${agent.id}/performance`} className="text-primary hover:underline">{agent.first_name} {agent.last_name}</Link>
                                                : 'Unassigned'}
                                        </p>
                                    </div>
                                    <Badge variant={interest.status === 'pending' ? 'destructive' : 'secondary'}>{interest.status}</Badge>
                                </div>
                            )
                        })}
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Appointments</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-4">
                         {appointments.length === 0 ? <p className="text-sm text-muted-foreground">No appointments found.</p> : appointments.map(appointment => (
                            <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <p className="font-medium">{appointment.property?.title || 'Appointment'}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(appointment.scheduled_at), 'PPP p')}
                                    </p>
                                     <p className="text-xs text-muted-foreground">
                                        With: {appointment.agent ? 
                                            <Link href={`/admin/users/${appointment.agent.id}/performance`} className="text-primary hover:underline">{appointment.agent.first_name} {appointment.agent.last_name}</Link>
                                            : 'N/A'}
                                    </p>
                                </div>
                                <Badge variant={appointment.status === 'scheduled' ? 'default' : 'outline'}>{appointment.status}</Badge>
                            </div>
                         ))}
                         </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
};


const AgentPerformanceDashboard = ({ data }: { data: PerformanceData }) => {
  const [performanceData, setPerformanceData] = useState(data);
  const [isUpdating, startTransition] = useTransition();
  const { toast } = useToast();

  const { profile, tasks, leads, calls, appointments, jobReports, salaryParameters } = performanceData;

  const kpis = {
    tasksCompleted: tasks.filter(t => t.status === 'Done').length,
    activeLeads: leads.filter(l => ['Hot', 'Warm'].includes(l.status)).length,
    totalCalls: calls.length,
    meetingsHeld: appointments.filter(a => new Date(a.scheduled_at) < new Date()).length
  };
  
  const salary = useMemo(() => {
    const completedTasks = tasks.filter(t => t.status === 'Done');
    const completedCallTasks = completedTasks.filter(t => t.task_type === 'Call');
    const completedMeetingTasks = completedTasks.filter(t => t.task_type === 'Meeting');
    const completedFollowUpTasks = completedTasks.filter(t => t.task_type === 'Follow-up');
    const approvedJobReports = jobReports.filter(r => r.status === 'approved');

    const callPay = completedCallTasks.length * (salaryParameters.per_call_rate || 0);
    const meetingPay = completedMeetingTasks.length * (salaryParameters.per_meeting_rate || 0);
    const followUpPay = completedFollowUpTasks.length * (salaryParameters.per_follow_up_rate || 0);
    const travelPay = approvedJobReports.reduce((total, report) => total + (report.travel_distance_km || 0), 0) * (salaryParameters.per_km_travel_rate || 0);
    
    return {
        total: callPay + meetingPay + followUpPay + travelPay,
        callPay,
        meetingPay,
        followUpPay,
        travelPay,
        completedCallsCount: completedCallTasks.length,
        completedMeetingsCount: completedMeetingTasks.length,
        completedFollowUpsCount: completedFollowUpTasks.length,
        approvedTravelKm: approvedJobReports.reduce((total, report) => total + (report.travel_distance_km || 0), 0)
    };
  }, [tasks, jobReports, salaryParameters]);

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

  const handleReportStatusUpdate = (reportId: string, status: 'approved' | 'rejected') => {
    startTransition(async () => {
        const result = await updateJobReportStatus(reportId, status);
        if (result.success) {
            toast({
                title: 'Success!',
                description: `Report has been ${status}.`
            });
            // Update local state to reflect the change
            setPerformanceData(prevData => ({
                ...prevData,
                jobReports: prevData.jobReports.map(report => 
                    report.id === reportId ? { ...report, status } : report
                )
            }));
        } else {
            toast({
                title: 'Error',
                description: result.error,
                variant: 'destructive'
            });
        }
    });
  };
  
    const getStatusBadge = (status: 'submitted' | 'approved' | 'rejected') => {
        switch (status) {
            case 'approved':
                return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
            case 'rejected':
                return <Badge variant="destructive">Rejected</Badge>;
            case 'submitted':
            default:
                return <Badge variant="outline">Submitted</Badge>;
        }
    };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance: {profile.first_name} {profile.last_name}</h1>
        <p className="text-muted-foreground">
          Detailed overview of this team member's activity and performance.
        </p>
      </div>
      
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

       <div className="grid gap-4 md:grid-cols-3">
          <Card className="col-span-1">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSign /> Estimated Salary
                </CardTitle>
                <CardDescription>Based on completed activities and current rates.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-bold">{formatCurrency(salary.total)}</div>
                <div className="space-y-2 mt-4 text-sm text-muted-foreground">
                    <div className="flex justify-between"><span>Calls ({salary.completedCallsCount}):</span> <span>{formatCurrency(salary.callPay)}</span></div>
                    <div className="flex justify-between"><span>Meetings ({salary.completedMeetingsCount}):</span> <span>{formatCurrency(salary.meetingPay)}</span></div>
                    <div className="flex justify-between"><span>Follow-ups ({salary.completedFollowUpsCount}):</span> <span>{formatCurrency(salary.followUpPay)}</span></div>
                    <div className="flex justify-between"><span>Travel ({salary.approvedTravelKm.toFixed(1)} km):</span> <span>{formatCurrency(salary.travelPay)}</span></div>
                </div>
            </CardContent>
          </Card>
          <Card className="col-span-1">
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
          <Card className="col-span-1">
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
        
        <Card>
            <CardHeader>
                <CardTitle>Job Reports</CardTitle>
                <CardDescription>Review submitted daily work and travel reports.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {jobReports.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No job reports submitted.</p>
                ) : (
                    jobReports.map(report => (
                        <div key={report.id} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between">
                                <h4 className="font-semibold">Report for {format(new Date(report.report_date), 'PPP')}</h4>
                                {getStatusBadge(report.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{report.details}</p>
                            
                            {report.travel_distance_km && (
                                <p className="text-sm mt-2"><span className="font-medium">Travel:</span> {report.travel_distance_km} km</p>
                            )}

                            {report.job_report_media.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Camera className="h-3 w-3" /> Uploaded Photos</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {report.job_report_media.map(media => (
                                            <a key={media.id} href={media.file_path} target="_blank" rel="noopener noreferrer">
                                                <Image src={media.file_path} alt="Report attachment" width={80} height={80} className="rounded-md object-cover aspect-square" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {report.status === 'submitted' && (
                                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                                    <Button variant="outline" size="sm" onClick={() => handleReportStatusUpdate(report.id, 'rejected')} disabled={isUpdating}>
                                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />} Reject
                                    </Button>
                                    <Button size="sm" onClick={() => handleReportStatusUpdate(report.id, 'approved')} disabled={isUpdating}>
                                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />} Approve
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </CardContent>
        </Card>

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
  )
};


export function UserPerformanceDashboard({ data }: UserPerformanceDashboardProps) {
  const { profile, interests, appointments } = data;

  if (profile.role === 'customer') {
      return <CustomerActivityDashboard profile={profile} interests={interests} appointments={appointments} />;
  }

  return <AgentPerformanceDashboard data={data} />;
}
