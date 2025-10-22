'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building2, 
  Phone, 
  Calendar, 
  TrendingUp, 
  CheckCircle,
  UserPlus,
  Building,
  Loader2
} from 'lucide-react';
import type { Profile, Property, PropertyInterest, Appointment, CallLog, AgentAssignment } from '@/lib/types';
import { AssignAgentDialog } from './assign-agent-dialog';

interface EnrichedInterest extends PropertyInterest {
  property: Property | null;
  customer: Profile | null;
}

interface AdminDashboardProps {
  userId: string;
  initialPendingUsers: Profile[];
  initialProperties: Property[];
  initialPropertyInterests: EnrichedInterest[];
  initialAppointments: Appointment[];
  initialCallLogs: CallLog[];
}

export function AdminDashboard({ 
    userId,
    initialPendingUsers,
    initialProperties,
    initialPropertyInterests,
    initialAppointments,
    initialCallLogs
}: AdminDashboardProps) {
  const [pendingUsers, setPendingUsers] = useState(initialPendingUsers);
  const [properties, setProperties] = useState(initialProperties);
  const [propertyInterests, setPropertyInterests] = useState(initialPropertyInterests);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [callLogs, setCallLogs] = useState(initialCallLogs);
  
  const [selectedInterest, setSelectedInterest] = useState<EnrichedInterest | null>(null);
  const [isAssigning, startAssignmentTransition] = useTransition();

  // Calculate metrics
  const totalProperties = properties.length;
  const availableProperties = properties.filter(p => p.status === 'Available').length;
  const pendingInterests = propertyInterests.filter(i => i.status === 'pending');
  const totalInterests = propertyInterests.length;
  const upcomingAppointments = appointments.filter(a => 
    new Date(a.scheduled_at) > new Date() && a.status === 'scheduled'
  ).length;
  const totalAppointments = appointments.length;

  const handleAssignmentSuccess = (interestId: string) => {
    setPropertyInterests(prev => prev.map(interest => 
        interest.id === interestId ? { ...interest, status: 'assigned' } : interest
    ));
    setSelectedInterest(null);
  };

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
                <div className="text-2xl font-bold">{totalProperties}</div>
                <p className="text-xs text-muted-foreground">
                {availableProperties} available
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
                Total Interests: {totalInterests}
                </p>
            </CardContent>
            </Card>

            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalAppointments}</div>
                <p className="text-xs text-muted-foreground">
                {upcomingAppointments} upcoming
                </p>
            </CardContent>
            </Card>
        </div>

        {/* Pending User Approvals */}
        <Card>
          <CardHeader>
            <CardTitle>Pending User Approvals</CardTitle>
            <CardDescription>
              Users waiting for account approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending approvals
              </div>
            ) : (
              <div className="space-y-4">
                {pendingUsers.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user.first_name} {user.last_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <Badge variant="outline" className="mt-1">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
                        <p className="font-medium">{interest.property?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          by {interest.customer?.first_name} {interest.customer?.last_name}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {interest.interest_level}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedInterest(interest)}
                        disabled={isAssigning}
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
