'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { LeadsTable } from '@/components/leads/leads-table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useLeadStore } from '@/lib/store/lead-store';
import type { Lead, Profile } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';

interface LeadsClientProps {
  initialLeads: (Lead & { profile: Profile | null })[];
}

export function LeadsClient({ initialLeads }: LeadsClientProps) {
  const setLeads = useLeadStore((state) => state.setLeads);
  const leads = useLeadStore((state) => state.leads);
  const initialized = useRef(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!initialized.current) {
      setLeads(initialLeads);
      initialized.current = true;
    }
  }, [initialLeads, setLeads]);

  const filteredLeads = leads.filter(lead => {
    if (activeTab === 'all') return true;
    return lead.status.toLowerCase() === activeTab;
  });

  return (
    <Tabs defaultValue="all" onValueChange={setActiveTab}>
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="hot">Hot</TabsTrigger>
          <TabsTrigger value="warm">Warm</TabsTrigger>
          <TabsTrigger value="cold" className="hidden sm:flex">
            Cold
          </TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-7 gap-1 text-sm">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only">Import</span>
          </Button>
          <Button size="sm" className="h-7 gap-1 text-sm">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only">New Lead</span>
          </Button>
        </div>
      </div>
      <TabsContent value={activeTab}>
        <Card>
          <CardHeader>
            <CardTitle>Leads</CardTitle>
            <CardDescription>Manage your client leads.</CardDescription>
          </CardHeader>
          <CardContent>
            <LeadsTable leads={filteredLeads} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
