'use client';

import { useState, useEffect } from 'react';
import type { Lead, Profile } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay, endOfWeek, endOfMonth, endOfYear } from 'date-fns';

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
    NINETY_NINE_ACRES: '99acres',
    MANUAL: 'Manual',
};

export function LeadsFilters({ allLeads, onFilterChange }: LeadsFiltersProps) {
  const [leadStatus, setLeadStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [platformSource, setPlatformSource] = useState<string>('all');

  useEffect(() => {
    let filtered = allLeads;

    // Filter by lead status
    if (leadStatus !== 'all') {
      filtered = filtered.filter(lead => lead.status === leadStatus);
    }
    
    // Filter by platform source
    if (platformSource !== 'all') {
      filtered = filtered.filter(lead => 
        lead.source?.toLowerCase().includes(platformSource.toLowerCase())
      );
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch(dateRange) {
        case 'today':
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          break;
        case 'this_week':
          startDate = startOfWeek(now);
          endDate = endOfWeek(now);
          break;
        case 'this_month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'this_year':
            startDate = startOfYear(now);
            endDate = endOfYear(now);
            break;
        default:
          startDate = new Date(0); // far past
          endDate = new Date(); // now
          break;
      }

      filtered = filtered.filter(lead => {
        const leadDate = new Date(lead.created_at);
        return leadDate >= startDate && leadDate <= endDate;
      });
    }

    onFilterChange(filtered);
  }, [leadStatus, platformSource, dateRange, allLeads, onFilterChange]);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Status:</label>
        <Select value={leadStatus} onValueChange={setLeadStatus}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Hot">Hot</SelectItem>
            <SelectItem value="Warm">Warm</SelectItem>
            <SelectItem value="Cold">Cold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Date Range:</label>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="this_week">This Week</SelectItem>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="this_year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Source:</label>
        <Select value={platformSource} onValueChange={setPlatformSource}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value={PLATFORMS.FACEBOOK}>Facebook</SelectItem>
            <SelectItem value={PLATFORMS.INSTAGRAM}>Instagram</SelectItem>
            <SelectItem value={PLATFORMS.WHATSAPP}>WhatsApp</SelectItem>
            <SelectItem value={PLATFORMS.OLX}>OLX</SelectItem>
            <SelectItem value={PLATFORMS.NINETY_NINE_ACRES}>99acres</SelectItem>
            <SelectItem value={PLATFORMS.MANUAL}>Manual Entry</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
