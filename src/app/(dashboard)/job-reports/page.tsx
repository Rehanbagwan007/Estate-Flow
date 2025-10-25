import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { JobReportForm } from './job-report-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { List, Camera } from 'lucide-react';
import type { JobReport } from '@/lib/types';
import Image from 'next/image';

export default async function JobReportsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  type ReportWithRelations = JobReport & { 
    reported_to: { first_name: string, last_name: string } | null,
    job_report_media: { file_path: string }[]
  };

  const { data: reports } = await supabase
    .from('job_reports')
    .select('*, reported_to:report_to(*), job_report_media(*)')
    .eq('user_id', user.id)
    .order('report_date', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Submit Daily Report</CardTitle>
            <CardDescription>
              Fill in your work details for today. Reports are used for performance evaluation and salary calculation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JobReportForm userRole={profile.role} userId={user.id} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>My Past Reports</CardTitle>
            <CardDescription>
              A log of your previously submitted job reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports && reports.length > 0 ? (
                reports.map((report: ReportWithRelations) => (
                  <div key={report.id} className="flex flex-col p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          Report for {new Date(report.report_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {report.details}
                        </p>
                         {report.site_visit_locations && (
                            <p className="text-sm text-muted-foreground mt-1">
                                <span className="font-medium">Visits:</span> {report.site_visit_locations}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Reported to: {report.reported_to?.first_name} {report.reported_to?.last_name}
                        </p>
                      </div>
                      <Badge variant="secondary">{report.status}</Badge>
                    </div>
                    {report.job_report_media && report.job_report_media.length > 0 && (
                        <div className="mt-4">
                            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Camera className="h-3 w-3" /> Uploaded Photos</p>
                            <div className="flex gap-2">
                                {report.job_report_media.map((media, index) => (
                                    <div key={index} className="relative h-16 w-16 rounded-md overflow-hidden">
                                        <Image src={media.file_path} alt={`Report photo ${index+1}`} fill className="object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <List className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No reports submitted yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
