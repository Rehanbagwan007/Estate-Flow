import { create } from 'zustand';
import type { PropertyInterest } from '@/lib/types';

interface InterestState {
  interests: PropertyInterest[];
  setInterests: (interests: PropertyInterest[]) => void;
  addInterest: (interest: PropertyInterest) => void;
}

export const useInterestStore = create<InterestState>((set) => ({
  interests: [],
  setInterests: (interests) => set({ interests }),
  addInterest: (interest) =>
    set((state) => ({
      interests: [...state.interests, interest],
    })),
}));
