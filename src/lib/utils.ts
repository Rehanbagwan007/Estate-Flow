import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { LeadStatus } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getStatusVariant = (status: LeadStatus): 'destructive' | 'default' | 'secondary' | 'outline' => {
  switch (status) {
    case 'Hot':
      return 'destructive'
    case 'Warm':
      return 'default'
    case 'Cold':
      return 'secondary'
    default:
      return 'outline'
  }
}

export const getInitials = (firstName?: string | null, lastName?: string | null) => {
  const first = firstName?.[0] || '';
  const last = lastName?.[0] || '';
  return `${first}${last}`.toUpperCase();
};
