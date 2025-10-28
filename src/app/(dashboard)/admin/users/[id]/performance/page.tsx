
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import type { Profile, Task, Lead, CallLog, Appointment, PropertyInterest, Property, JobReport, JobReportMedia } from '@/lib/types';
import { UserPerformanceDashboard } from './user-performance-dashboard';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Link from 'next/link';
import { getSalaryParameters } from '@/app/(dashboard)/admin/settings/actions';

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


type PerformanceData = {
    profile: Profile;
    tasks: Task[];
    leads: Lead[];
    calls: CallLog[];
    appointments: EnrichedAppointment[];
    interests: EnrichedInterest[];
    jobReports: EnrichedJobReport[];
    salaryParameters: { [key: string]: number };
}

async function getUserPerformanceData(userId: string): Promise<PerformanceData | null> {
    const supabase = createClient();
    const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', userId).single();
    
    if (profileError || !profile) {
        console.error('Error fetching user profile:', profileError);
        return null;
    }

    const salaryParameters = await getSalaryParameters();

    if (profile.role === 'customer') {
        const [interestsRes, appointmentsRes] = await Promise.all([
             supabase
                .from('property_interests')
                .select(`
                    *,
                    properties (id, title),
                    agent_assignments ( profiles (id, first_name, last_name) )
                `)
                .eq('customer_id', userId)
                .order('created_at', { ascending: false }),
             supabase
                .from('appointments')
                .select(`
                    *, 
                    agent:agent_id(id, first_name, last_name),
                    property:property_interest_id(properties(title))
                `)
                .eq('customer_id', userId)
                .order('scheduled_at', { ascending: false })
        ]);

        return {
            profile,
            tasks: [],
            leads: [],
            calls: [],
            jobReports: [],
            salaryParameters: {},
            interests: (interestsRes.data as any) || [],
            appointments: (appointmentsRes.data as any) || []
        };
    }

    // Default data fetching for non-customer roles
    const [tasksRes, leadsRes, callsRes, appointmentsRes, jobReportsRes] = await Promise.all([
        supabase.from('tasks').select('*, property:related_property_id(title)').eq('assigned_to', userId).order('created_at', { ascending: false }),
        supabase.from('leads').select('*').eq('assigned_to', userId).order('created_at', { ascending: false }),
        supabase.from('call_logs').select('*').eq('agent_id', userId).order('created_at', { ascending: false }),
        supabase.from('appointments').select('*, agent:agent_id(id, first_name, last_name), property:property_interest_id(properties(title))').eq('agent_id', userId).order('created_at', { ascending: false }),
        supabase.from('job_reports').select('*, job_report_media(*)').eq('user_id', userId).order('report_date', { ascending: false })
    ]);

    return {
        profile,
        tasks: tasksRes.data || [],
        leads: leadsRes.data || [],
        calls: callsRes.data || [],
        appointments: (appointmentsRes.data as any) || [],
        interests: [],
        jobReports: (jobReportsRes.data as EnrichedJobReport[]) || [],
        salaryParameters,
    };
}

export default async function UserPerformancePage({ params }: { params: { id: string } }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login');
    }

    const { data: currentUserProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

    if (!currentUserProfile || !['super_admin', 'admin'].includes(currentUserProfile.role)) {
        return redirect('/dashboard');
    }

    const performanceData = await getUserPerformanceData(params.id);

    if (!performanceData) {
        notFound();
    }
    
    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild><Link href="/dashboard">Dashboard</Link></BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild><Link href="/admin/users">User Management</Link></BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>
                            {performanceData.profile.first_name} {performanceData.profile.last_name}
                        </BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <UserPerformanceDashboard data={performanceData} />
        </div>
    );
}
