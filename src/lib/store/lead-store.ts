import { create } from 'zustand';
import type { Lead, Profile } from '@/lib/types';

type LeadWithProfile = Lead & { profile: Profile | null };

interface LeadState {
  leads: LeadWithProfile[];
  setLeads: (leads: LeadWithProfile[]) => void;
  addLead: (lead: LeadWithProfile) => void;
  updateLead: (lead: LeadWithProfile) => void;
  deleteLead: (leadId: string) => void;
}

export const useLeadStore = create<LeadState>((set) => ({
  leads: [],
  setLeads: (leads) => set({ leads }),
  addLead: (lead) => set((state) => ({ leads: [...state.leads, lead] })),
  updateLead: (lead) =>
    set((state) => ({
      leads: state.leads.map((l) => (l.id === lead.id ? lead : l)),
    })),
  deleteLead: (leadId) =>
    set((state) => ({
      leads: state.leads.filter((l) => l.id !== leadId),
    })),
}));
