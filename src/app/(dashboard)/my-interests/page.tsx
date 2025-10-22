import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Building2, Calendar, Phone } from 'lucide-react';

export default async function MyInterestsPage() {
  const supabase = await createClient();
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

  // Get user's property interests
  // BUG FIX: Removed 'property_type' from the selection as it does not exist in the 'properties' table schema.
  const { data: interests, error } = await supabase
    .from('property_interests')
    .select(`
      id,
      interest_level,
       message,
      preferred_meeting_time,
      status,
      created_at,
      properties!inner (
        id,
        title,
        price,
        address,
        city,
        state,
        bedrooms,
        bathrooms
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
          Properties you've shown interest in and their status
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
              Awaiting response
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
              {interests?.filter(i => i.status === 'contacted').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Agent has contacted you
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Property Interests</CardTitle>
          <CardDescription>
            Track the status of properties you're interested in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!interests || interests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No property interests yet.</p>
                <p className="text-sm">Browse properties to show your interest!</p>
              </div>
            ) : (
              interests?.map((interest) => (
                <div key={interest.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{interest.properties?.title || 'Property not available'}</p>
                      <p className="text-sm text-muted-foreground">
                        {interest.properties?.city ? `${interest.properties.city}, ${interest.properties.state} • ₹${interest.properties.price?.toLocaleString()}` : 'Details not available'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {interest.properties ? `${interest.properties.bedrooms} bed • ${interest.properties.bathrooms} bath` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{interest.interest_level}</Badge>
                    <Badge variant={interest.status === 'contacted' ? 'default' : 'secondary'}>
                      {interest.status}
                    </Badge>
                    <Button variant="outline" size="sm" disabled={!interest.properties}>
                      View Details
                    </Button>
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
