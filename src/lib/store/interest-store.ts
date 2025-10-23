import { create } from 'zustand';
import type { Property, PropertyInterest } from '@/lib/types';

interface EnrichedInterest extends PropertyInterest {
  property?: Property;
}

interface InterestState {
  interests: EnrichedInterest[];
  setInterests: (interests: EnrichedInterest[]) => void;
  addInterest: (interest: EnrichedInterest) => void;
}

export const useInterestStore = create<InterestState>((set) => ({
  interests: [],
  setInterests: (interests) => set({ interests }),
  addInterest: (interest) =>
    set((state) => ({
      interests: [...state.interests, interest],
    })),
}));
