
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SalarySettingsForm } from './salary-settings-form';
import { getSalaryParameters } from './actions';

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
    redirect('/dashboard');
  }
  
  const salaryParameters = await getSalaryParameters();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Manage global settings for the CRM.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Salary Parameters</CardTitle>
          <CardDescription>
            Set the rates for calculating performance-based salaries for team members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SalarySettingsForm currentSettings={salaryParameters} />
        </CardContent>
      </Card>
    </div>
  );
}
