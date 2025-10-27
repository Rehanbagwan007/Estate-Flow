'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Heart, 
  Calendar, 
  MapPin,
  DollarSign,
  Search,
  Filter,
  Eye
} from 'lucide-react';
import type { Property, PropertyInterest, Appointment, Profile } from '@/lib/types';
import { useInterestStore } from '@/lib/store/interest-store';
import { usePropertyStore } from '@/lib/store/property-store';
import { useAppointmentStore } from '@/lib/store/appointment-store';
import Image from 'next/image';
import { PropertyInterestForm } from '../properties/property-interest-form';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';


export interface EnrichedProperty extends Property {
    property_media?: { file_path: string }[];
}
export interface EnrichedInterest extends PropertyInterest {
    properties?: Property;
}
export interface EnrichedAppointment extends Appointment {
    profiles?: Profile;
}

interface CustomerDashboardProps {
  userId: string;
}

export function CustomerDashboard({ userId }: CustomerDashboardProps) {
  const { toast } = useToast();
  const { interests: myInterests, setInterests, addInterest } = useInterestStore();
  const { properties, setProperties } = usePropertyStore();
  const { appointments: myAppointments, setAppointments } = useAppointmentStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const fetchData = async () => {
        setIsLoading(true);
        const [
            propertiesResult,
            myInterestsResult,
            myAppointmentsResult
        ] = await Promise.all([
            supabase.from('properties').select('*, property_media(*)').eq('status', 'Available'),
            supabase.from('property_interests').select('*, properties(*)').eq('customer_id', userId),
            supabase.from('appointments').select('*, profiles!appointments_agent_id_fkey(*)').eq('customer_id', userId)
        ]);

        setProperties((propertiesResult.data as EnrichedProperty[]) || []);
        setInterests((myInterestsResult.data as EnrichedInterest[]) || []);
        setAppointments((myAppointmentsResult.data as EnrichedAppointment[]) || []);
        setIsLoading(false);
    };
    fetchData();
  }, [userId, setProperties, setInterests, setAppointments]);


  const [selectedProperty, setSelectedProperty] = useState<EnrichedProperty | null>(null);
  const [showInterestForm, setShowInterestForm] = useState(false);

  const handleInterestSuccess = (newInterest: PropertyInterest) => {
    addInterest({ ...newInterest, properties: selectedProperty || undefined });
    toast({
      title: 'Success!',
      description: 'Your interest has been submitted. Our team will contact you shortly.',
    });
    setShowInterestForm(false);
    setSelectedProperty(null);
  };
  
  const totalProperties = properties.length;
  const myInterestsCount = myInterests.length;
  const upcomingAppointments = myAppointments.filter(a => 
    new Date(a.scheduled_at) > new Date() && a.status === 'scheduled'
  ).length;

  if (isLoading) {
      return <div>Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">Property Search</h1>
        <p className="text-muted-foreground">
          Find your perfect property from our verified listings
        </p>
      </div>

      {/* Placeholder for future filter component */}
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
              {properties.slice(0, 6).map((property) => {
                const isInterested = myInterests.some(i => i.property_id === property.id);
                return (
                    <div key={property.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-video bg-gray-200 relative">
                        {property?.property_media && property.property_media.length > 0 ? (
                            <Image 
                            src={property.property_media[0].file_path} 
                            alt={property.title || 'Property Image'}
                            width={400}
                            height={225}
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
                                <span className="font-semibold text-lg">{formatCurrency(property.price || 0)}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    size="sm" 
                                    className="flex-1"
                                    onClick={() => { setSelectedProperty(property); setShowInterestForm(true); }}
                                    disabled={isInterested}
                                >
                                    <Heart className="h-4 w-4 mr-1" />
                                    {isInterested ? 'Interested' : "I'm Interested"}
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      {selectedProperty && (
        <Dialog open={showInterestForm} onOpenChange={(isOpen) => {
            if (!isOpen) {
                setShowInterestForm(false);
                setSelectedProperty(null);
            }
        }}>
            <DialogContent className="sm:max-w-md">
                <PropertyInterestForm
                    propertyId={selectedProperty.id}
                    propertyTitle={selectedProperty.title}
                    onSuccess={handleInterestSuccess}
                />
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
