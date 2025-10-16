import type { Property, Lead, Task, Profile } from './types';

export const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Modern Downtown Loft',
    description: 'A beautiful loft in the heart of the city.',
    address: '123 Main St',
    city: 'Metropolis',
    state: 'CA',
    zip_code: '90210',
    price: 1200000,
    bedrooms: 2,
    bathrooms: 2,
    area_sqft: 1500,
    status: 'Available',
    owner_name: 'John Smith',
    owner_contact: '555-1234',
    created_by: 'agent-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Suburban Family Home',
    description: 'Spacious home with a large backyard.',
    address: '456 Oak Ave',
    city: 'Smallville',
    state: 'KS',
    zip_code: '66001',
    price: 450000,
    bedrooms: 4,
    bathrooms: 3,
    area_sqft: 2500,
    status: 'Sold',
    owner_name: 'Jane Doe',
    owner_contact: '555-5678',
    created_by: 'agent-2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Cozy Beachside Cottage',
    description: 'Charming cottage with ocean views.',
    address: '789 Beach Blvd',
    city: 'Coast City',
    state: 'FL',
    zip_code: '33101',
    price: 750000,
    bedrooms: 3,
    bathrooms: 2,
    area_sqft: 1800,
    status: 'Rented',
    owner_name: 'Peter Parker',
    owner_contact: '555-9012',
    created_by: 'agent-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockLeads: (Lead & { profile: Profile | null })[] = [
  {
    id: 'lead-1',
    first_name: 'Bruce',
    last_name: 'Wayne',
    email: 'bruce@wayne.com',
    phone: '555-1111',
    status: 'Hot',
    assigned_to: 'agent-1',
    created_by: 'admin-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profile: {
      id: 'agent-1', first_name: 'Clark', last_name: 'Kent', email: 'clark@dailyplanet.com', role: 'agent', phone: '555-0001', created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }
  },
  {
    id: 'lead-2',
    first_name: 'Diana',
    last_name: 'Prince',
    email: 'diana@themyscira.gov',
    phone: '555-2222',
    status: 'Warm',
    assigned_to: 'agent-2',
    created_by: 'admin-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profile: {
      id: 'agent-2', first_name: 'Lois', last_name: 'Lane', email: 'lois@dailyplanet.com', role: 'agent', phone: '555-0002', created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }
  },
  {
    id: 'lead-3',
    first_name: 'Barry',
    last_name: 'Allen',
    email: 'barry@ccpd.gov',
    phone: '555-3333',
    status: 'Cold',
    assigned_to: 'agent-1',
    created_by: 'admin-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profile: {
      id: 'agent-1', first_name: 'Clark', last_name: 'Kent', email: 'clark@dailyplanet.com', role: 'agent', phone: '555-0001', created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }
  },
];

export const mockTasks: Task[] = [
    {
        id: 'task-1',
        title: 'Follow up with Bruce Wayne',
        description: 'Discuss the downtown loft property.',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Todo',
        assigned_to: 'agent-1',
        related_lead_id: 'lead-1',
        related_property_id: '1',
        created_by: 'admin-1',
        created_at: new Date().toISOString(),
    },
    {
        id: 'task-2',
        title: 'Schedule property visit for Diana',
        description: 'Show the beachside cottage.',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'InProgress',
        assigned_to: 'agent-2',
        related_lead_id: 'lead-2',
        related_property_id: '3',
        created_by: 'admin-1',
        created_at: new Date().toISOString(),
    },
];

export const mockProfiles: Profile[] = [
    { id: 'agent-1', first_name: 'Clark', last_name: 'Kent', email: 'clark@dailyplanet.com', role: 'agent', phone: '555-0001', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'agent-2', first_name: 'Lois', last_name: 'Lane', email: 'lois@dailyplanet.com', role: 'agent', phone: '555-0002', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'admin-1', first_name: 'Perry', last_name: 'White', email: 'perry@dailyplanet.com', role: 'admin', phone: '555-0000', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]
