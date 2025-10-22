import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, Phone, Mail, Loader2 } from 'lucide-react';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';

// This metadata will trigger a page refresh after 5 seconds, giving the
// user profile time to be created in the database.
export const metadata: Metadata = {
  title: 'Account Pending',
  other: {
    'http-equiv': 'refresh',
    content: '5;url=/dashboard',
  },
};

export default async function PendingApprovalPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id',user.id)
    .single();

  // If the profile is now found, redirect to the dashboard immediately.
  if (profile && profile.role !== 'customer') {
    redirect('/dashboard');
  }
  if (profile && profile.role === 'customer' && profile.approval_status === 'approved') {
    redirect('/dashboard');
  }


  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {profile ? getStatusIcon(profile.approval_status) : <Loader2 className="h-5 w-5 animate-spin" />}
          </div>
          <CardTitle className="text-2xl font-bold">
            Account Status
          </CardTitle>
          <CardDescription>
            {profile ? 'Your account is currently under review by our admin team.' : 'Finalizing your account setup...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <Badge 
              className={`text-sm px-4 py-2 ${getStatusColor(profile?.approval_status || 'pending')}`}
            >
              {profile?.approval_status?.toUpperCase() || 'PENDING'}
            </Badge>
          </div>

          {!profile || profile.approval_status === 'pending' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• Our admin team will review your account details</li>
                  <li>• You'll receive an email notification once approved</li>
                  <li>• Once approved, you can browse and express interest in properties</li>
                  <li>• This process typically takes 24-48 hours</li>
                   <li>• You will be redirected shortly.</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Account Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{user.email}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {profile?.approval_status === 'approved' && (
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Congratulations!</h3>
                <p className="text-green-800">
                  Your account has been approved. You can now access all features of our platform.
                </p>
              </div>
              <Button asChild className="w-full">
                <a href="/dashboard">Go to Dashboard</a>
              </Button>
            </div>
          )}

          {profile?.approval_status === 'rejected' && (
            <div className="text-center space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">Account Not Approved</h3>
                <p className="text-red-800">
                  Unfortunately, your account could not be approved at this time. 
                  Please contact our support team for more information.
                </p>
              </div>
              <div className="space-y-2">
                <Button asChild variant="outline" className="w-full">
                  <a href="/contact">Contact Support</a>
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <a href="/login">Sign Out</a>
                </Button>
              </div>
            </div>
          )}

          <div className="text-center text-sm text-gray-500">
            <p>Need help? Contact us at support@estateflow.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
