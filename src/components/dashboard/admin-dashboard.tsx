'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  Calendar,
  UserPlus,
  Building,
  Clock
} from 'lucide-react';
import type { Profile, Property, PropertyInterest, Appointment, Task } from '@/lib/types';
import { AssignAgentDialog } from './assign-agent-dialog';
import { createClient } from '@/lib/supabase/client';

interface EnrichedInterest extends PropertyInterest {
  properties: Property | null;
  profiles: Profile | null;
}

interface AdminDashboardProps {
  userId: string;
}

export function AdminDashboard({ userId }: AdminDashboardProps) {
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyInterests, setPropertyInterests] = useState<EnrichedInterest[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedInterest, setSelectedInterest] = useState<EnrichedInterest | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const fetchData = async () => {
      setIsLoading(true);
      const [
        pendingUsersResult,
        propertiesResult,
        propertyInterestsResult,
        appointmentsResult,
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('approval_status', 'pending'),
        supabase.from('properties').select('*'),
        supabase.from('property_interests').select('*, properties:property_id(*), profiles:customer_id(*)'),
        supabase.from('appointments').select('*, profiles!appointments_agent_id_fkey(*), profiles!appointments_customer_id_fkey(*)'),
      ]);

      setPendingUsers(pendingUsersResult.data || []);
      setProperties(propertiesResult.data || []);
      setPropertyInterests((propertyInterestsResult.data as EnrichedInterest[]) || []);
      setAppointments(appointmentsResult.data || []);
      setIsLoading(false);
    };

    fetchData();
  }, []);
  
  const handleAssignmentSuccess = (interestId: string, assignedTask: Task) => {
    setPropertyInterests(prev => prev.map(interest => 
        interest.id === interestId ? { ...interest, status: 'assigned' } : interest
    ));
    setSelectedInterest(null);
  };
  
  const pendingInterests = propertyInterests.filter(i => i.status === 'pending');

  if (isLoading) {
      return <div>Loading dashboard...</div>;
  }

  return (
    <>
      <AssignAgentDialog
        interest={selectedInterest}
        isOpen={!!selectedInterest}
        onClose={() => setSelectedInterest(null)}
        onSuccess={handleAssignmentSuccess}
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage properties, users, and oversee operations
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{pendingUsers.length}</div>
                <p className="text-xs text-muted-foreground">
                Users awaiting approval
                </p>
            </CardContent>
            </Card>

            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Properties</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{properties.length}</div>
                <p className="text-xs text-muted-foreground">
                {properties.filter(p => p.status === 'Available').length} available
                </p>
            </CardContent>
            </Card>

            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Leads</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{pendingInterests.length}</div>
                <p className="text-xs text-muted-foreground">
                Total Interests: {propertyInterests.length}
                </p>
            </CardContent>
            </Card>

            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{appointments.length}</div>
                <p className="text-xs text-muted-foreground">
                {appointments.filter(a => new Date(a.scheduled_at) > new Date() && a.status === 'scheduled').length} upcoming
                </p>
            </CardContent>
            </Card>
        </div>

        {/* Recent Property Interests (New Leads) */}
        <Card>
          <CardHeader>
            <CardTitle>New Leads from Property Interests</CardTitle>
            <CardDescription>
              Latest customer interest expressions that need assignment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingInterests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No new leads yet.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingInterests.map((interest) => (
                  <div key={interest.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Building className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{interest.properties?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          by {interest.profiles?.first_name} {interest.profiles?.last_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="mt-1">
                                {interest.interest_level}
                            </Badge>
                            {interest.preferred_meeting_time && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Prefers: {new Date(interest.preferred_meeting_time).toLocaleString()}
                                </span>
                            )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedInterest(interest)}
                      >
                        Assign Agent
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
