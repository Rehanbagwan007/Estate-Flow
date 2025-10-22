import { create } from 'zustand';
import type { Appointment } from '@/lib/types';

interface AppointmentState {
  appointments: Appointment[];
  setAppointments: (appointments: Appointment[]) => void;
  addAppointment: (appointment: Appointment) => void;
}

export const useAppointmentStore = create<AppointmentState>((set) => ({
  appointments: [],
  setAppointments: (appointments) => set({ appointments }),
  addAppointment: (appointment) =>
    set((state) => ({
      appointments: [...state.appointments, appointment],
    })),
}));
