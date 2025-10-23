'use client';

import { StatCards } from '@/components/dashboard/stat-cards';
import { LeadsByStatusChart } from '@/components/dashboard/leads-by-status-chart';
import { PropertyStatusChart } from '@/components/dashboard/property-status-chart';
import { PropertiesTable } from '@/components/properties/properties-table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Lead, Property, Profile } from '@/lib/types';
import { usePropertyStore } from '@/lib/store/property-store';
import { useLeadStore } from '@/lib/store/lead-store';
import { useEffect, useRef } from 'react';

interface DashboardClientProps {
  properties: Property[];
  leads: (Lead & { profile: Profile | null })[];
}

export function DashboardClient({ properties, leads }: DashboardClientProps) {
  const setProperties = usePropertyStore((state) => state.setProperties);
  const setLeads = useLeadStore((state) => state.setLeads);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      setProperties(properties);
      setLeads(leads);
      initialized.current = true;
    }
  }, [properties, leads, setProperties, setLeads]);

  const storeProperties = usePropertyStore((state) => state.properties);
  const storeLeads = useLeadStore((state) => state.leads);
  
  const hotLeadsCount = storeLeads.filter(l => l.status === 'Hot').length;
  const newPropertiesCount = storeProperties.filter(p => p.status === 'Available' || p.status === 'Upcoming').length;
  const soldPropertiesCount = storeProperties.filter(p => p.status === 'Sold').length;

  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <StatCards 
          hotLeads={hotLeadsCount}
          newProperties={newPropertiesCount}
          propertiesSold={soldPropertiesCount}
        />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
          <LeadsByStatusChart />
          <PropertyStatusChart />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Recent Properties</CardTitle>
            <CardDescription>A quick look at the latest property listings.</CardDescription>
          </CardHeader>
          <CardContent>
            <PropertiesTable properties={storeProperties.slice(0, 5)} />
          </CardContent>
        </Card>
      </div>

      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Follow-ups and new leads.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for activity feed */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="font-medium">New Hot Lead: Bruce Wayne</p>
                  <p className="text-sm text-muted-foreground">Assigned to Clark Kent.</p>
                </div>
                <p className="text-sm text-muted-foreground">5m ago</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="font-medium">Property Sold: Suburban Home</p>
                  <p className="text-sm text-muted-foreground">Finalized by Lois Lane.</p>
                </div>
                <p className="text-sm text-muted-foreground">2h ago</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="font-medium">Task Completed: Follow up</p>
                  <p className="text-sm text-muted-foreground">For lead Diana Prince.</p>
                </div>
                <p className="text-sm text-muted-foreground">1d ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
