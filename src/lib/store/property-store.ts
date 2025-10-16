import { create } from 'zustand';
import type { Property } from '@/lib/types';

interface PropertyState {
  properties: Property[];
  setProperties: (properties: Property[]) => void;
  addProperty: (property: Property) => void;
  updateProperty: (property: Property) => void;
  deleteProperty: (propertyId: string) => void;
}

export const usePropertyStore = create<PropertyState>((set) => ({
  properties: [],
  setProperties: (properties) => set({ properties }),
  addProperty: (property) => set((state) => ({ properties: [...state.properties, property] })),
  updateProperty: (property) =>
    set((state) => ({
      properties: state.properties.map((p) => (p.id === property.id ? property : p)),
    })),
  deleteProperty: (propertyId) =>
    set((state) => ({
      properties: state.properties.filter((p) => p.id !== propertyId),
    })),
}));
