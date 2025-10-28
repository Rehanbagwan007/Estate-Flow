
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Building2, Calendar, Phone, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteInterest } from './actions';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default async function MyInterestsPage() {
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

  if (!profile) {
    redirect('/login');
  }

  // Check if user is a customer
  if (profile.role !== 'customer') {
    redirect('/dashboard');
  }

  const { data: interests, error } = await supabase
    .from('property_interests')
    .select(`
      *,
      property:property_id (
        id,
        title,
        price,
        city,
        state,
        bedrooms,
        bathrooms,
        property_type,
        status
      )
    `)
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching interests:", error);
    }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Property Interests</h1>
        <p className="text-muted-foreground">
          Properties you've shown interest in and their status.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interests</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interests?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Properties you're interested in
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {interests?.filter(i => i.status === 'pending').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting agent assignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacted</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {interests?.filter(i => i.status === 'contacted' || i.status === 'assigned' || i.status === 'meeting_scheduled').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Agent is in touch
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Property Interests</CardTitle>
          <CardDescription>
            Track the status of properties you're interested in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!interests || interests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>You haven't shown interest in any properties yet.</p>
                <Button asChild variant="link" className="mt-2">
                    <Link href="/dashboard">Browse Properties</Link>
                </Button>
              </div>
            ) : (
              interests?.map((interest) => (
                <div key={interest.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <Link href={`/properties/${interest.property?.id}`} className="font-medium hover:underline">
                        {interest.property?.title || 'Property not available'}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {interest.property?.city ? `${interest.property.city}, ${interest.property.state} • ${formatCurrency(interest.property.price || 0)}` : 'Details not available'}
                      </p>
                       <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{interest.interest_level}</Badge>
                          <Badge variant={interest.status === 'contacted' || interest.status === 'assigned' ? 'default' : 'secondary'}>
                            {interest.status}
                          </Badge>
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently remove your interest from this property.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <form action={deleteInterest.bind(null, interest.id)}>
                            <AlertDialogAction type="submit" className="bg-destructive hover:bg-destructive/90">Continue</AlertDialogAction>
                          </form>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
