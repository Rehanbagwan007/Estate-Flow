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
<<<<<<< HEAD
            approval_status: 'pending' | 'approved' | 'rejected';
=======
            approval_status: 'approved' | 'rejected' | 'pending';
>>>>>>> 2a2cb5be7b204e2fcf4530a65a8b7c337ab406e7
            role:
              | 'super_admin'
              | 'admin'
              | 'agent'
              | 'caller_1'
              | 'caller_2'
              | 'sales_manager'
              | 'sales_executive_1'
              | 'sales_executive_2'
              | 'customer';
          };
        };
         properties: {
          Row: {
            property_type: 'Residential' | 'Commercial' | 'Land';
          }
        }
      };
    };
  }
>;

export type Profile = Tables<'profiles'>;
export type Property = Tables<'properties'>;
export type Lead = Tables<'leads'>;
export type Task = Tables<'tasks'>;
export type LeadNote = Tables<'lead_notes'>;
export type PropertyInterest = Tables<'property_interests'>;
export type Appointment = Tables<'appointments'>;
export type CallLog = Tables<'call_logs'>;
export type FieldVisit = Tables<'field_visits'>;
export type Notification = Tables<'notifications'>;
export type IntegrationSetting = Tables<'integration_settings'>;
export type AgentAssignment = Tables<'agent_assignments'>;

export type UserRole = Profile['role'];
export type LeadStatus = Lead['status'];
export type PropertyStatus = Property['status'];
export type InterestLevel = PropertyInterest['interest_level'];
export type InterestStatus = PropertyInterest['status'];
export type AppointmentStatus = Appointment['status'];
export type CallStatus = CallLog['call_status'];
export type CallType = CallLog['call_type'];
export type VisitType = FieldVisit['visit_type'];
export type NotificationType = Notification['type'];
export type NotificationChannel = Notification['sent_via'];
export type IntegrationType = IntegrationSetting['integration_type'];
export type AssignmentType = AgentAssignment['assignment_type'];
export type AssignmentPriority = AgentAssignment['priority'];
export type AssignmentStatus = Assignment['status'];
export type PropertyType = Property['property_type'];
