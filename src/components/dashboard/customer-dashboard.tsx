'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { expressInterest } from '@/components/dashboard/actions/custumer-interest';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Heart, 
  Calendar, 
  MapPin,
  DollarSign,
  Search,
  Filter,
  Loader2,
  Eye
} from 'lucide-react';
import type { Property, PropertyInterest, Appointment, Profile } from '@/lib/types';

// Define the shape of our props with joined tables
interface EnrichedProperty extends Property {
    property_media?: { file_path: string }[];
}
interface EnrichedInterest extends PropertyInterest {
    property?: Property;
}
interface EnrichedAppointment extends Appointment {
    agent?: Profile;
}

interface CustomerDashboardProps {
  userId: string;
  initialProperties: EnrichedProperty[];
  initialMyInterests: EnrichedInterest[];
  initialMyAppointments: EnrichedAppointment[];
}

export function CustomerDashboard({ 
    userId, 
    initialProperties, 
    initialMyInterests, 
    initialMyAppointments 
}: CustomerDashboardProps) {
  const [properties, setProperties] = useState(initialProperties || []);
  const [myInterests, setMyInterests] = useState(initialMyInterests || []);
  const [myAppointments, setMyAppointments] = useState(initialMyAppointments || []);

  const [isPending, startTransition] = useTransition();
  // State to track which specific property interest is being submitted
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleInterestClick = (propertyId: string) => {
    setSubmittingId(propertyId); // Set the ID of the property being submitted
    startTransition(async () => {
      const result = await expressInterest(propertyId);

      if (result.success) {
        toast({
          title: 'Success!',
          description: result.message,
        });
        // Optimistically update the UI to reflect the new interest
        const interestedProperty = properties.find(p => p.id === propertyId);
       
      } else {
        toast({
          title: 'Uh oh!',
          description: result.message,
          variant: 'destructive',
        });
      }
      setSubmittingId(null); // Reset submitting ID after completion
    });
  };
  
  // Metrics calculations
  const totalProperties = properties?.length || 0;
  const myInterestsCount = myInterests?.length || 0;
  const upcomingAppointments = myAppointments?.filter(a => 
    a && new Date(a.scheduled_at) > new Date() && a.status === 'scheduled'
  ).length || 0;
  const affordableProperties = properties?.filter(p => p?.price < 5000000) || [];
  const luxuryProperties = properties?.filter(p => p?.price >= 10000000) || [];

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
      
      {/* Featured Properties */}
      <Card>
        <CardHeader>
          <CardTitle>Featured Properties</CardTitle>
          <CardDescription>
            Handpicked properties just for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!properties || properties.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No properties available at the moment
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {properties.slice(0, 6).map((property) => (
                property && <div key={property.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gray-200 relative">
                    {property?.property_media && property.property_media.length > 0 ? (
                      <img 
                        src={property.property_media[0].file_path} 
                        alt={property.title || 'Property Image'}
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
                      <span className="font-semibold text-lg">₹{Number(property.price || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleInterestClick(property.id)}
                        disabled={isPending || myInterests?.some(i => i?.property_id === property.id)}
                      >
                        {submittingId === property.id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                            <Heart className="h-4 w-4 mr-1" />
                        )}
                        {myInterests?.some(i => i?.property_id === property.id) ? 'Interested' : "I'm Interested"}
                      </Button>
                      
                       <Dialog>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[625px]">
                            <DialogHeader>
                                <DialogTitle>{property.title}</DialogTitle>
                                <DialogDescription>{property.address}, {property.city}, {property.state}</DialogDescription>
                            </DialogHeader>
                            <p>{property.description}</p>
                        </DialogContent>
                       </Dialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
