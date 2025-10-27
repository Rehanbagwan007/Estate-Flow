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
} from "@/components/ui/tabs";
import { useLeadStore } from '@/lib/store/lead-store';
import type { Lead, Profile } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';
import { LeadsFilters } from '@/components/leads/leads-filters';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddLeadForm } from '@/components/leads/add-lead-form';

interface LeadsClientProps {
  initialLeads: (Lead & { profile: Profile | null })[];
  teamMembers: Profile[];
}

export function LeadsClient({ initialLeads, teamMembers }: LeadsClientProps) {
  const { leads, setLeads } = useLeadStore();
  const initialized = useRef(false);
  const [filteredLeads, setFilteredLeads] = useState(initialLeads);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    if (!initialized.current) {
      setLeads(initialLeads);
      setFilteredLeads(initialLeads);
      initialized.current = true;
    }
  }, [initialLeads, setLeads]);

  // Update filteredLeads whenever the global store changes
  useEffect(() => {
    setFilteredLeads(leads);
  }, [leads]);
  
  const handleFilterChange = (filteredData: (Lead & { profile: Profile | null })[]) => {
    setFilteredLeads(filteredData);
  };

  const handleLeadAdded = () => {
    // The store will be updated by the action, so we just need to close the form.
    setIsFormOpen(false);
  };

  return (
    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
      <Tabs defaultValue="all">
        <div className="flex items-center mb-4">
            <LeadsFilters allLeads={leads} onFilterChange={handleFilterChange} />
            <div className="ml-auto flex items-center gap-2">
                <DialogTrigger asChild>
                    <Button size="sm" className="h-8 gap-1 text-sm">
                        <PlusCircle className="h-4 w-4" />
                        <span className="sm:not-sr-only">New Lead</span>
                    </Button>
                </DialogTrigger>
            </div>
        </div>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Leads</CardTitle>
              <CardDescription>Manage your client leads and potential sales opportunities.</CardDescription>
            </CardHeader>
            <CardContent>
              <LeadsTable leads={filteredLeads} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
       <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>
            Manually create a new lead and assign it to a team member.
          </DialogDescription>
        </DialogHeader>
        <AddLeadForm teamMembers={teamMembers} onSuccess={handleLeadAdded} />
      </DialogContent>
    </Dialog>
  );
}
