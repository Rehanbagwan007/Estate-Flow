import type { MergeDeep } from 'type-fest';
import type { Database as Db, Tables, Enums } from './supabase-types';

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
            approval_status: 'approved' | 'rejected' | 'pending';
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
        };
        tasks: {
          Row: {
            task_type: 'Follow-up' | 'Call' | 'Site Visit' | 'Meeting';
            customer_phone: string | null;
          }
        }
      };
    };
  }
>;

export type Profile = Tables<'profiles'>;
export type Property = Tables<'properties'> & { property_media?: { file_path: string }[] };
export type Lead = Tables<'leads'>;
export type Task = Tables<'tasks'> & { related_customer_id?: string | null; related_assignment_id?: string | null; customer_phone?: string | null };
export type LeadNote = Tables<'lead_notes'>;
export type PropertyInterest = Tables<'property_interests'>;
export type Appointment = Tables<'appointments'>;
export type CallLog = Tables<'call_logs'>;
export type FieldVisit = Tables<'field_visits'>;
export type Notification = Tables<'notifications'>;
export type IntegrationSetting = Tables<'integration_settings'>;
export type AgentAssignment = Tables<'agent_assignments'>;
export type PropertyShare = Tables<'property_shares'>;
export type JobReport = Tables<'job_reports'>;
export type JobReportMedia = Tables<'job_report_media'>;
export type TaskMedia = Tables<'task_media'>;

export type UserRole = Enums<'user_role'>;
export type LeadStatus = Enums<'lead_status'>;
export type PropertyStatus = Enums<'property_status'>;
export type InterestLevel = Enums<'interest_level'>;
export type InterestStatus = Enums<'interest_status'>;
export type AppointmentStatus = Enums<'appointment_status'>;
export type CallStatus = Enums<'call_status'>;
export type CallType = Enums<'call_type'>;
export type VisitType = Enums<'visit_type'>;
export type NotificationType = Enums<'notification_type'>;
export type NotificationChannel = Enums<'notification_channel'>;
export type IntegrationType = Enums<'integration_type'>;
export type AssignmentType = Enums<'assignment_type'>;
export type AssignmentPriority = Enums<'assignment_priority'>;
export type AssignmentStatus = Enums<'assignment_status'>;
export type PropertyType = Enums<'property_type'>;
export type TaskStatus = Enums<'task_status'>;
export type JobReportStatus = Enums<'job_report_status'>;
export type TaskType = 'Follow-up' | 'Call' | 'Site Visit' | 'Meeting';

    

    