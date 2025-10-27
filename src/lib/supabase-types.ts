export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agent_assignments: {
        Row: {
          agent_id: string
          assigned_by: string
          assignment_type: Database["public"]["Enums"]["assignment_type"]
          created_at: string
          customer_id: string
          due_date: string | null
          id: string
          notes: string | null
          priority: Database["public"]["Enums"]["assignment_priority"]
          property_interest_id: string | null
          status: Database["public"]["Enums"]["assignment_status"]
          updated_at: string
        }
        Insert: {
          agent_id: string
          assigned_by: string
          assignment_type?: Database["public"]["Enums"]["assignment_type"]
          created_at?: string
          customer_id: string
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["assignment_priority"]
          property_interest_id?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string
        }
        Update: {
          agent_id?: string
          assigned_by?: string
          assignment_type?: Database["public"]["Enums"]["assignment_type"]
          created_at?: string
          customer_id?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["assignment_priority"]
          property_interest_id?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_assignments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_assignments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_assignments_property_interest_id_fkey"
            columns: ["property_interest_id"]
            isOneToOne: false
            referencedRelation: "property_interests"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          agent_id: string
          created_at: string
          customer_id: string
          duration_minutes: number | null
          id: string
          location: string | null
          notes: string | null
          property_interest_id: string
          scheduled_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          customer_id: string
          duration_minutes?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          property_interest_id: string
          scheduled_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          customer_id?: string
          duration_minutes?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          property_interest_id?: string
          scheduled_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_property_interest_id_fkey"
            columns: ["property_interest_id"]
            isOneToOne: false
            referencedRelation: "property_interests"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          agent_id: string
          call_id: string
          call_status: Database["public"]["Enums"]["call_status"]
          call_type: Database["public"]["Enums"]["call_type"]
          created_at: string
          customer_id: string | null
          duration_seconds: number | null
          id: string
          notes: string | null
          property_id: string | null
          recording_duration_seconds: number | null
          recording_url: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          call_id: string
          call_status?: Database["public"]["Enums"]["call_status"]
          call_type?: Database["public"]["Enums"]["call_type"]
          created_at?: string
          customer_id?: string | null
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          property_id?: string | null
          recording_duration_seconds?: number | null
          recording_url?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          call_id?: string
          call_status?: Database["public"]["Enums"]["call_status"]
          call_type?: Database["public"]["Enums"]["call_type"]
          created_at?: string
          customer_id?: string | null
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          property_id?: string | null
          recording_duration_seconds?: number | null
          recording_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      field_visits: {
        Row: {
          address: string | null
          agent_id: string
          created_at: string
          duration_minutes: number | null
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          photos: string[] | null
          property_id: string | null
          visit_date: string
          visit_type: Database["public"]["Enums"]["visit_type"]
        }
        Insert: {
          address?: string | null
          agent_id: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          photos?: string[] | null
          property_id?: string | null
          visit_date: string
          visit_type?: Database["public"]["Enums"]["visit_type"]
        }
        Update: {
          address?: string | null
          agent_id?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          photos?: string[] | null
          property_id?: string | null
          visit_date?: string
          visit_type?: Database["public"]["Enums"]["visit_type"]
        }
        Relationships: [
          {
            foreignKeyName: "field_visits_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_visits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_settings: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          integration_type: Database["public"]["Enums"]["integration_type"]
          is_active: boolean | null
          settings: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          integration_type: Database["public"]["Enums"]["integration_type"]
          is_active?: boolean | null
          settings: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          integration_type?: Database["public"]["Enums"]["integration_type"]
          is_active?: boolean | null
          settings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_reports: {
        Row: {
          id: string
          user_id: string
          report_to: string | null
          report_date: string
          details: string
          travel_distance_km: number | null
          site_visit_locations: string | null
          status: Database["public"]["Enums"]["job_report_status"]
          created_at: string
          updated_at: string
          related_task_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          report_to?: string | null
          report_date?: string
          details: string
          travel_distance_km?: number | null
          site_visit_locations?: string | null
          status?: Database["public"]["Enums"]["job_report_status"]
          created_at?: string
          updated_at?: string
          related_task_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          report_to?: string | null
          report_date?: string
          details?: string
          travel_distance_km?: number | null
          site_visit_locations?: string | null
          status?: Database["public"]["Enums"]["job_report_status"]
          created_at?: string
          updated_at?: string
          related_task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_reports_report_to_fkey"
            columns: ["report_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_job_reports_related_task"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      job_report_media: {
        Row: {
          id: string
          report_id: string
          file_path: string
          file_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          file_path: string
          file_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          file_path?: string
          file_type?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_report_media_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "job_reports"
            referencedColumns: ["id"]
          }
        ]
      }
      task_media: {
        Row: {
            id: string
            task_id: string
            file_path: string
            file_type: string | null
            created_at: string
        }
        Insert: {
            id?: string
            task_id: string
            file_path: string
            file_type?: string | null
            created_at?: string
        }
        Update: {
            id?: string
            task_id?: string
            file_path?: string
            file_type?: string | null
            created_at?: string
        }
        Relationships: [
            {
                foreignKeyName: "task_media_task_id_fkey"
                columns: ["task_id"]
                isOneToOne: false
                referencedRelation: "tasks"
                referencedColumns: ["id"]
            }
        ]
      }
      lead_notes: {
        Row: {
          created_at: string
          created_by: string
          id: string
          lead_id: string
          note: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          lead_id: string
          note: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          lead_id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string | null
          phone: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name?: string | null
          phone?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string | null
          phone?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          sent_at: string | null
          sent_via: Database["public"]["Enums"]["notification_channel"]
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          sent_at?: string | null
          sent_via?: Database["public"]["Enums"]["notification_channel"]
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          sent_at?: string | null
          sent_via?: Database["public"]["Enums"]["notification_channel"]
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approval_status: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approval_status?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approval_status?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          area_sqft: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          owner_contact: string | null
          owner_name: string | null
          price: number
          property_type: Database["public"]["Enums"]["property_type"] | null
          state: string
          status: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at: string
          zip_code: string
        }
        Insert: {
          address: string
          area_sqft?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          owner_contact?: string | null
          owner_name?: string | null
          price: number
          property_type?:
            | Database["public"]["Enums"]["property_type"]
            | null
          state: string
          status?: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at?: string
          zip_code: string
        }
        Update: {
          address?: string
          area_sqft?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          owner_contact?: string | null
          owner_name?: string | null
          price?: number
          property_type?:
            | Database["public"]["Enums"]["property_type"]
            | null
          state?: string
          status?: Database["public"]["Enums"]["property_status"]
          title?: string
          updated_at?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      property_interests: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          interest_level: Database["public"]["Enums"]["interest_level"]
          message: string | null
          preferred_meeting_time: string | null
          property_id: string
          status: Database["public"]["Enums"]["interest_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          interest_level?: Database["public"]["Enums"]["interest_level"]
          message?: string | null
          preferred_meeting_time?: string | null
          property_id: string
          status?: Database["public"]["Enums"]["interest_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          interest_level?: Database["public"]["Enums"]["interest_level"]
          message?: string | null
          preferred_meeting_time?: string | null
          property_id?: string
          status?: Database["public"]["Enums"]["interest_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_interests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_interests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_media: {
        Row: {
          created_at: string
          file_path: string
          file_type: string | null
          id: string
          property_id: string | null
        }
        Insert: {
          created_at?: string
          file_path: string
          file_type?: string | null
          id?: string
          property_id?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string
          file_type?: string | null
          id?: string
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_media_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_shares: {
        Row: {
          created_at: string
          id: string
          platform: string
          post_url: string | null
          property_id: string
          shared_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          post_url?: string | null
          property_id: string
          shared_by: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          post_url?: string | null
          property_id?: string
          shared_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_shares_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_shares_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          location_address: string | null
          related_assignment_id: string | null
          related_customer_id: string | null
          related_lead_id: string | null
          related_property_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          task_type: Database["public"]["Enums"]["task_type"]
          customer_phone: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          location_address?: string | null
          related_assignment_id?: string | null
          related_customer_id?: string | null
          related_lead_id?: string | null
          related_property_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          task_type?: Database["public"]["Enums"]["task_type"]
          customer_phone?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          location_address?: string | null
          related_assignment_id?: string | null
          related_customer_id?: string | null
          related_lead_id?: string | null
          related_property_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          task_type?: Database["public"]["Enums"]["task_type"]
          customer_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tasks_related_assignment_id"
            columns: ["related_assignment_id"]
            isOneToOne: false
            referencedRelation: "agent_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tasks_related_customer_id"
            columns: ["related_customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_lead_id_fkey"
            columns: ["related_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_property_id_fkey"
            columns: ["related_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_claim: {
        Args: {
          claim: string
        }
        Returns: Json
      }
      get_my_claims: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_my_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      assignment_priority: "low" | "medium" | "high" | "urgent"
      assignment_status:
        | "assigned"
        | "accepted"
        | "in_progress"
        | "completed"
        | "cancelled"
      assignment_type: "property_interest" | "follow_up" | "cold_call" | "meeting"
      call_status:
        | "initiated"
        | "ringing"
        | "answered"
        | "completed"
        | "failed"
        | "busy"
        | "no_answer"
      call_type: "inbound" | "outbound"
      integration_type:
        | "exotel"
        | "whatsapp"
        | "olx"
        | "99acres"
        | "facebook"
        | "instagram"
      interest_level: "interested" | "very_interested" | "ready_to_buy"
      interest_status:
        | "pending"
        | "assigned"
        | "contacted"
        | "meeting_scheduled"
        | "completed"
        | "cancelled"
      job_report_status: "submitted" | "approved" | "rejected"
      lead_status: "Hot" | "Warm" | "Cold"
      notification_channel: "app" | "email" | "whatsapp" | "sms"
      notification_type:
        | "property_interest"
        | "appointment_reminder"
        | "call_reminder"
        | "approval_status"
        | "task_assigned"
        | "meeting_scheduled"
      property_status: "Available" | "Sold" | "Rented" | "Upcoming"
      property_type: "Residential" | "Commercial" | "Land"
      task_status: "Todo" | "InProgress" | "Done"
      user_role:
        | "admin"
        | "agent"
        | "super_admin"
        | "caller_1"
        | "caller_2"
        | "sales_manager"
        | "sales_executive_1"
        | "sales_executive_2"
        | "customer"
      visit_type:
        | "property_visit"
        | "customer_meeting"
        | "site_inspection"
        | "follow_up"
      task_type:
        | 'Follow-up'
        | 'Call'
        | 'Site Visit'
        | 'Meeting'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

    

    

    