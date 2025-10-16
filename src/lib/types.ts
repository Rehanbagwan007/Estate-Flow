import type { MergeDeep } from 'type-fest';
import type { Database as Db, Tables } from './supabase-types';

// Override the type for a specific column in a view
export type Database = MergeDeep<
  Db,
  {
    public: {
      Tables: {
        profiles: {
          Row: {
            // id is a primary key in profiles, referencing auth.users.id
            id: string;
            role: 'admin' | 'agent';
          };
        };
      };
    };
  }
>;

export type Profile = Tables<'profiles'>;
export type Property = Tables<'properties'>;
export type Lead = Tables<'leads'>;
export type Task = Tables<'tasks'>;
export type LeadNote = Tables<'lead_notes'>;

export type UserRole = Profile['role'];
export type LeadStatus = Lead['status'];
export type PropertyStatus = Property['status'];
