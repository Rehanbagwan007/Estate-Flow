import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Heart, 
  Calendar, 
  Phone,
  MapPin,
  DollarSign,
  Search,
  Filter
} from 'lucide-react';

interface CustomerDashboardProps {
  userId: string;
}

export async function CustomerDashboard({ userId }: CustomerDashboardProps) {
  const supabase = createClient();

  // Fetch customer-specific data
  const [
    propertiesResult,
    myInterestsResult,
    myAppointmentsResult
  ] = await Promise.all([
    (await supabase).from('properties').select('*, property_media(*)').eq('status', 'Available'),
    (await supabase).from('property_interests').select('*, property:properties(*)').eq('customer_id', userId),
    (await supabase).from('appointments').select('*, agent:profiles(*)').eq('customer_id', userId)
  ]);

  const properties = propertiesResult.data || [];
  const myInterests = myInterestsResult.data || [];
  const myAppointments = myAppointmentsResult.data || [];

  // Calculate metrics
  const totalProperties = properties.length;
  const myInterestsCount = myInterests.length;
  const upcomingAppointments = myAppointments.filter(a => 
    new Date(a.scheduled_at) > new Date() && a.status === 'scheduled'
  ).length;

  // Filter properties by price range (example filters)
  const affordableProperties = properties.filter(p => p.price < 5000000);
  const luxuryProperties = properties.filter(p => p.price >= 10000000);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Property Search</h1>
        <p className="text-muted-foreground">
          Find your perfect property from our verified listings
        </p>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by location, property type, or features..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              <Button>Search Properties</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProperties}</div>
            <p className="text-xs text-muted-foreground">
              Verified listings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Interests</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myInterestsCount}</div>
            <p className="text-xs text-muted-foreground">
              Properties I'm interested in
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled appointments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Property Categories */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Affordable Properties
            </CardTitle>
            <CardDescription>
              Properties under ₹50 Lakhs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{affordableProperties.length}</div>
            <p className="text-sm text-muted-foreground">
              Perfect for first-time buyers
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Mid-Range Properties
            </CardTitle>
            <CardDescription>
              ₹50 Lakhs - ₹1 Crore
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {properties.filter(p => p.price >= 5000000 && p.price < 10000000).length}
            </div>
            <p className="text-sm text-muted-foreground">
              Great value for money
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              Luxury Properties
            </CardTitle>
            <CardDescription>
              Above ₹1 Crore
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{luxuryProperties.length}</div>
            <p className="text-sm text-muted-foreground">
              Premium lifestyle options
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Featured Properties */}
      <Card>
        <CardHeader>
          <CardTitle>Featured Properties</CardTitle>
          <CardDescription>
            Handpicked properties just for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No properties available at the moment
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {properties.slice(0, 6).map((property) => (
                <div key={property.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gray-200 relative">
                    {property.property_media && property.property_media.length > 0 ? (
                      <img 
                        src={property.property_media[0].file_path} 
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Building2 className="h-12 w-12" />
                      </div>
                    )}
                    <Badge className="absolute top-2 right-2 bg-white text-black">
                      {property.status}
                    </Badge>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{property.title}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>{property.city}, {property.state}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-semibold text-lg">₹{property.price.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Heart className="h-4 w-4 mr-1" />
                        I'm Interested
                      </Button>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Interests */}
      {myInterests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Property Interests</CardTitle>
            <CardDescription>
              Properties you've expressed interest in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myInterests.slice(0, 3).map((interest) => (
                <div key={interest.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{interest.property?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Interest level: {interest.interest_level}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {interest.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">₹{interest.property?.price.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(interest.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {myInterests.length > 3 && (
                <div className="text-center">
                  <Button variant="outline">
                    View All My Interests ({myInterests.length})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Appointments */}
      {myAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Appointments</CardTitle>
            <CardDescription>
              Scheduled property visits and meetings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myAppointments
                .filter(a => new Date(a.scheduled_at) > new Date())
                .slice(0, 3)
                .map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        Meeting with {appointment.agent?.first_name} {appointment.agent?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(appointment.scheduled_at).toLocaleString()}
                      </p>
                      {appointment.location && (
                        <p className="text-sm text-muted-foreground">
                          Location: {appointment.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {appointment.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
