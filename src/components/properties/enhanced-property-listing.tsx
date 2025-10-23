'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PropertyInterestForm } from './property-interest-form';
import { PropertyFilters, PropertyFilters as PropertyFiltersType } from './property-filters';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Bed, 
  Bath, 
  Square, 
  Heart,
  Eye,
  Calendar,
  Phone
} from 'lucide-react';

interface Property {
  id: string;
  title: string;
  description: string | null;
  price: number;
  city: string;
  state: string;
  address: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  status: string;
  created_at: string;
  property_media?: Array<{
    id: string;
    file_path: string;
    file_type: string;
  }>;
}

interface EnhancedPropertyListingProps {
  properties: Property[];
  userRole: string;
}

export function EnhancedPropertyListing({ properties, userRole }: EnhancedPropertyListingProps) {
  const [filteredProperties, setFilteredProperties] = useState<Property[]>(properties);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showInterestForm, setShowInterestForm] = useState(false);
  const [filters, setFilters] = useState<PropertyFiltersType>({
    search: '',
    location: '',
    propertyType: '',
    priceRange: [0, 10000000],
    bedrooms: '',
    bathrooms: '',
    status: 'Available'
  });

  // Filter properties based on current filters
  useEffect(() => {
    let filtered = properties;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(property => 
        property.title.toLowerCase().includes(searchLower) ||
        property.description?.toLowerCase().includes(searchLower) ||
        property.city.toLowerCase().includes(searchLower) ||
        property.state.toLowerCase().includes(searchLower)
      );
    }

    // Location filter
    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      filtered = filtered.filter(property => 
        property.city.toLowerCase().includes(locationLower) ||
        property.state.toLowerCase().includes(locationLower) ||
        property.address.toLowerCase().includes(locationLower)
      );
    }

    // Price range filter
    filtered = filtered.filter(property => 
      property.price >= filters.priceRange[0] && property.price <= filters.priceRange[1]
    );

    // Bedrooms filter
    if (filters.bedrooms) {
      const minBedrooms = parseInt(filters.bedrooms);
      filtered = filtered.filter(property => 
        property.bedrooms && property.bedrooms >= minBedrooms
      );
    }

    // Bathrooms filter
    if (filters.bathrooms) {
      const minBathrooms = parseInt(filters.bathrooms);
      filtered = filtered.filter(property => 
        property.bathrooms && property.bathrooms >= minBathrooms
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(property => property.status === filters.status);
    }

    setFilteredProperties(filtered);
  }, [properties, filters]);

  const handleInterestClick = (property: Property) => {
    setSelectedProperty(property);
    setShowInterestForm(true);
  };

  const handleInterestSuccess = () => {
    setShowInterestForm(false);
    setSelectedProperty(null);
    // You could show a success toast here
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)}Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(0)}L`;
    } else {
      return `₹${price.toLocaleString()}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'Sold':
        return 'bg-red-100 text-red-800';
      case 'Rented':
        return 'bg-blue-100 text-blue-800';
      case 'Upcoming':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <PropertyFilters 
        onFiltersChange={setFilters}
        initialFilters={filters}
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {filteredProperties.length} Properties Found
          </h2>
          <p className="text-muted-foreground">
            Showing results for your search criteria
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {filteredProperties.length} results
          </Badge>
        </div>
      </div>

      {/* Property Grid */}
      {filteredProperties.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No properties found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters to see more results
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                <Badge 
                  className={`absolute top-2 right-2 ${getStatusColor(property.status)}`}
                >
                  {property.status}
                </Badge>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 left-2"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
              
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                      {property.title}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{property.city}, {property.state}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-lg font-bold text-green-600">
                    <DollarSign className="h-5 w-5" />
                    <span>{formatPrice(property.price)}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {property.bedrooms && (
                      <div className="flex items-center gap-1">
                        <Bed className="h-4 w-4" />
                        <span>{property.bedrooms} bed</span>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="flex items-center gap-1">
                        <Bath className="h-4 w-4" />
                        <span>{property.bathrooms} bath</span>
                      </div>
                    )}
                    {property.area_sqft && (
                      <div className="flex items-center gap-1">
                        <Square className="h-4 w-4" />
                        <span>{property.area_sqft} sqft</span>
                      </div>
                    )}
                  </div>

                  {property.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {property.description}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    {userRole === 'customer' && property.status === 'Available' && (
                      <Dialog open={showInterestForm && selectedProperty?.id === property.id} onOpenChange={setShowInterestForm}>
                        <DialogTrigger asChild>
                          <Button 
                            className="flex-1"
                            onClick={() => handleInterestClick(property)}
                          >
                            <Heart className="h-4 w-4 mr-1" />
                            I'm Interested
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Express Interest</DialogTitle>
                            <DialogDescription>
                              Let us know about your interest in this property
                            </DialogDescription>
                          </DialogHeader>
                          <PropertyInterestForm
                            propertyId={property.id}
                            propertyTitle={property.title}
                            onSuccess={handleInterestSuccess}
                          />
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Interest Form Dialog */}
      {selectedProperty && (
        <Dialog open={showInterestForm} onOpenChange={setShowInterestForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Express Interest in {selectedProperty.title}</DialogTitle>
              <DialogDescription>
                Let us know about your interest and we'll connect you with our team
              </DialogDescription>
            </DialogHeader>
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
