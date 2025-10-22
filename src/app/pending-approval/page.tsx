import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/actions';
import { Clock } from 'lucide-react';

export default async function PendingApprovalPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('approval_status, role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.approval_status === 'approved' && !['super_admin', 'admin'].includes(profile.role))) {
    return redirect('/dashboard');
  }
  
  if (['super_admin', 'admin'].includes(profile.role)) {
      return redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Clock className="h-12 w-12 text-primary" />
          <CardTitle className="mt-4">Account Pending Approval</CardTitle>
          <CardDescription>
            Your account has been created successfully, but it needs to be approved by an administrator before you can access the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">
            You will receive a notification once your account is approved. Please check back later.
          </p>
          <form action={logout}>
            <Button variant="outline" type="submit">
              Log Out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
