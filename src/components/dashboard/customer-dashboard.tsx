
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
  Search,
  Filter,
  Eye
} from 'lucide-react';
import type { Property, PropertyInterest, Appointment, Profile } from '@/lib/types';
import { useInterestStore } from '@/lib/store/interest-store';
import { usePropertyStore } from '@/lib/store/property-store';
import { useAppointmentStore } from '@/lib/store/appointment-store';
import Image from 'next/image';
import Link from 'next/link';
import { PropertyInterestForm } from '../properties/property-interest-form';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { PropertyFilters as PropertyFiltersComponent, type PropertyFilters as PropertyFiltersType } from '@/components/properties/property-filters';


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

const defaultFilters: PropertyFiltersType = {
  search: '',
  location: '',
  propertyType: 'all',
  priceRange: [0, 50000000],
  bedrooms: 'all',
  bathrooms: 'all',
  status: 'Available'
};

export function CustomerDashboard({ userId }: CustomerDashboardProps) {
  const { toast } = useToast();
  const { interests: myInterests, setInterests, addInterest } = useInterestStore();
  const { properties, setProperties } = usePropertyStore();
  const { appointments: myAppointments, setAppointments } = useAppointmentStore();
  const [isLoading, setIsLoading] = useState(true);

  const [filteredProperties, setFilteredProperties] = useState<EnrichedProperty[]>([]);
  const [filters, setFilters] = useState<PropertyFiltersType>(defaultFilters);

  useEffect(() => {
    const supabase = createClient();
    const fetchData = async () => {
        setIsLoading(true);
        const [
            propertiesResult,
            myInterestsResult,
            myAppointmentsResult
        ] = await Promise.all([
            supabase.from('properties').select('*, property_media(*)'),
            supabase.from('property_interests').select('*, properties(*)').eq('customer_id', userId),
            supabase.from('appointments').select('*, profiles!appointments_agent_id_fkey(*)').eq('customer_id', userId)
        ]);

        const allProps = (propertiesResult.data as EnrichedProperty[]) || [];
        setProperties(allProps);
        setFilteredProperties(allProps);
        setInterests((myInterestsResult.data as EnrichedInterest[]) || []);
        setAppointments((myAppointmentsResult.data as EnrichedAppointment[]) || []);
        setIsLoading(false);
    };
    fetchData();
  }, [userId, setProperties, setInterests, setAppointments]);

  useEffect(() => {
    let filtered = properties;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.city.toLowerCase().includes(searchLower)
      );
    }
    if (filters.location) {
      filtered = filtered.filter(p => p.city.toLowerCase().includes(filters.location.toLowerCase()));
    }
    if (filters.propertyType && filters.propertyType !== 'all') {
      filtered = filtered.filter(p => p.property_type === filters.propertyType);
    }
    if (filters.bedrooms && filters.bedrooms !== 'all') {
      filtered = filtered.filter(p => p.bedrooms && p.bedrooms >= parseInt(filters.bedrooms));
    }
     if (filters.bathrooms && filters.bathrooms !== 'all') {
      filtered = filtered.filter(p => p.bathrooms && p.bathrooms >= parseInt(filters.bathrooms));
    }
    if(filters.status && filters.status !== 'all') {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    filtered = filtered.filter(p => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]);
    
    setFilteredProperties(filtered);
  }, [filters, properties]);

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

      <PropertyFiltersComponent onFiltersChange={setFilters} initialFilters={filters} />
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProperties}</div>
            <p className="text-xs text-muted-foreground">
              {filteredProperties.length} matching your filters
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
          {filteredProperties.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No properties match your filters.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProperties.slice(0, 6).map((property) => {
                const isInterested = myInterests.some(i => i.property_id === property.id);
                return (
                    <div key={property.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-video bg-gray-200 relative">
                        {property?.property_media && property.property_media.length > 0 ? (
                            <Image 
                            src={property.property_media[0].file_path} 
                            alt={property.title || 'Property Image'}
                            fill
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
                                <Button asChild size="sm" variant="outline" className="flex-1">
                                    <Link href={`/properties/${property.id}`}>
                                        <Eye className="h-4 w-4 mr-1" />
                                        View Details
                                    </Link>
                                </Button>
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
