'use client';

import { useState, useEffect } from 'react';
import type { Lead, Profile } from '@/lib/types';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Facebook, Instagram, MessageSquare } from 'lucide-react';
import { OlxLogo, NinetyNineAcresLogo } from '@/components/icons/platforms';

type LeadWithProfile = Lead & { profile: Profile | null };

interface LeadsFiltersProps {
  allLeads: LeadWithProfile[];
  onFilterChange: (filteredLeads: LeadWithProfile[]) => void;
}

const PLATFORMS = {
    FACEBOOK: 'Facebook',
    INSTAGRAM: 'Instagram',
    WHATSAPP: 'WhatsApp',
    OLX: 'OLX',
    NINETY_NINE_ACRES: '99acres'
};

export function LeadsFilters({ allLeads, onFilterChange }: LeadsFiltersProps) {
  const [leadStatus, setLeadStatus] = useState<string>('all');
  const [platformSources, setPlatformSources] = useState<string[]>([]);

  useEffect(() => {
    let filtered = allLeads;

    // Filter by lead status
    if (leadStatus !== 'all') {
      filtered = filtered.filter(lead => lead.status.toLowerCase() === leadStatus);
    }
    
    // Filter by platform sources
    if (platformSources.length > 0) {
      filtered = filtered.filter(lead => 
        platformSources.some(source => lead.source?.toLowerCase().includes(source.toLowerCase()))
      );
    }

    onFilterChange(filtered);
  }, [leadStatus, platformSources, allLeads, onFilterChange]);

  return (
    <div className="flex items-center gap-4">
       <ToggleGroup type="single" value={leadStatus} onValueChange={(value) => value && setLeadStatus(value)} defaultValue="all">
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="hot">Hot</ToggleGroupItem>
          <ToggleGroupItem value="warm">Warm</ToggleGroupItem>
          <ToggleGroupItem value="cold">Cold</ToggleGroupItem>
      </ToggleGroup>

      <ToggleGroup 
        type="multiple" 
        variant="outline" 
        value={platformSources}
        onValueChange={setPlatformSources}
        aria-label="Filter by source"
      >
        <ToggleGroupItem value={PLATFORMS.FACEBOOK} aria-label="Facebook">
            <Facebook className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value={PLATFORMS.INSTAGRAM} aria-label="Instagram">
            <Instagram className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value={PLATFORMS.WHATSAPP} aria-label="WhatsApp">
            <MessageSquare className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value={PLATFORMS.OLX} aria-label="OLX">
            <OlxLogo className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value={PLATFORMS.NINETY_NINE_ACRES} aria-label="99acres">
            <NinetyNineAcresLogo className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
