import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, LogOut } from 'lucide-react';
import { logout } from '@/lib/actions';
import { cookies } from 'next/headers';

export default async function PendingApprovalPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // If somehow user is not logged in, send to login
    return redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('approval_status')
    .eq('id', user.id)
    .single();
  
  if (profile?.approval_status === 'approved') {
    // If user is approved, send to dashboard
    return redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Clock className="h-12 w-12 text-primary" />
          <CardTitle className="mt-4 text-2xl font-bold">Account Pending Approval</CardTitle>
          <CardDescription>
            Your account has been created successfully, but it needs to be approved by an administrator before you can proceed.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
            <p className="text-sm text-center text-muted-foreground">
                You will be notified once your account is approved. Please check back later. If you believe this is an error, please contact support.
            </p>
            <form action={logout}>
                <Button variant="outline">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
