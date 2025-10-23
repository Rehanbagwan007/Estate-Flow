import type { LeadStatus, PropertyStatus, UserRole } from './types'

export const PROPERTY_STATUSES: PropertyStatus[] = ['Available', 'Sold', 'Rented', 'Upcoming'];
export const LEAD_STATUSES: LeadStatus[] = ['Hot', 'Warm', 'Cold'];
export const USER_ROLES: UserRole[] = ['admin', 'agent'];
