
import { createClient } from '@/lib/supabase/server';
import { whatsappService } from './whatsapp';
import type { Profile } from '../types';

interface NotificationData {
  user_id: string;
  type: 'property_interest' | 'appointment_reminder' | 'call_reminder' | 'approval_status' | 'task_assigned' | 'meeting_scheduled' | 'report_submitted' | 'task_completed';
  title: string;
  message: string;
  data?: Record<string, any>;
  send_via?: 'app' | 'email' | 'whatsapp' | 'sms';
}

export class NotificationService {
  private static instance: NotificationService;
  private supabase: any;

  constructor() {
    this.supabase = null;
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = createClient();
    }
    return this.supabase;
  }
  
  async getManagerToNotify(submittingUserRole: Profile['role']): Promise<string | null> {
    const supabase = await this.getSupabase();
    let managerRole: Profile['role'] | null = null;
  
    if (submittingUserRole === 'admin') {
      managerRole = 'super_admin';
    } else if (submittingUserRole !== 'super_admin') {
      managerRole = 'admin';
    }
  
    if (managerRole) {
      const { data: manager } = await supabase.from('profiles').select('id').eq('role', managerRole).limit(1).single();
      return manager?.id || null;
    }
    
    // If no admin is found, fallback to super_admin for non-admin roles
    if (submittingUserRole !== 'super_admin') {
       const { data: superAdmin } = await supabase.from('profiles').select('id').eq('role', 'super_admin').limit(1).single();
       return superAdmin?.id || null;
    }

    return null;
  }

  async createNotification(notification: NotificationData): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.user_id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data || null,
          sent_via: notification.send_via || 'app'
        });

      if (error) {
        console.error('Error creating notification:', error);
        return false;
      }

      if (notification.send_via === 'whatsapp') {
          const { data: userProfile } = await supabase.from('profiles').select('phone').eq('id', notification.user_id).single();
          if (userProfile?.phone) {
              await whatsappService.sendSimpleMessage(userProfile.phone, `${notification.title}\n\n${notification.message}`);
          }
      }

      return true;
    } catch (error) {
      console.error('Error in createNotification:', error);
      return false;
    }
  }

  async sendPropertyInterestNotification(
    customerId: string,
    propertyTitle: string,
    propertyPrice: number,
    agentName: string,
    meetingTime: string
  ): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      
      // Get customer phone number
      const { data: customer } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', customerId)
        .single();

      if (!customer?.phone) {
        console.error('Customer phone number not found');
        return false;
      }

      // Create app notification
      await this.createNotification({
        user_id: customerId,
        type: 'property_interest',
        title: 'Property Interest Confirmed',
        message: `Your interest in ${propertyTitle} has been confirmed. Agent ${agentName} will contact you soon.`,
        data: {
          property_title: propertyTitle,
          property_price: propertyPrice,
          agent_name: agentName,
          meeting_time: meetingTime
        }
      });

      // Send WhatsApp notification
      const whatsappSuccess = await whatsappService.sendPropertyInterestNotification(
        customer.phone,
        {
          property_title: propertyTitle,
          property_price: propertyPrice,
          agent_name: agentName,
          meeting_time: meetingTime
        }
      );

      return whatsappSuccess;
    } catch (error) {
      console.error('Error sending property interest notification:', error);
      return false;
    }
  }

  async sendAppointmentReminder(
    customerId: string,
    agentId: string,
    propertyTitle: string,
    agentName: string,
    meetingTime: string,
    location?: string
  ): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      
      // Get customer phone number
      const { data: customer } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', customerId)
        .single();

      if (!customer?.phone) {
        console.error('Customer phone number not found');
        return false;
      }

      // Create app notification
      await this.createNotification({
        user_id: customerId,
        type: 'appointment_reminder',
        title: 'Meeting Reminder',
        message: `Your property visit for ${propertyTitle} is in 30 minutes.`,
        data: {
          property_title: propertyTitle,
          agent_name: agentName,
          meeting_time: meetingTime,
          location
        }
      });

      // Send WhatsApp reminder
      const whatsappSuccess = await whatsappService.sendAppointmentReminder(
        customer.phone,
        {
          property_title: propertyTitle,
          agent_name: agentName,
          meeting_time: meetingTime,
          location
        }
      );

      return whatsappSuccess;
    } catch (error) {
      console.error('Error sending appointment reminder:', error);
      return false;
    }
  }

  async sendApprovalNotification(
    userId: string,
    status: 'approved' | 'rejected',
    reason?: string
  ): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      
      // Get user phone number
      const { data: user } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', userId)
        .single();

      if (!user?.phone) {
        console.error('User phone number not found');
        return false;
      }

      // Create app notification
      await this.createNotification({
        user_id: userId,
        type: 'approval_status',
        title: status === 'approved' ? 'Account Approved' : 'Account Not Approved',
        message: status === 'approved' 
          ? 'Your account has been approved. You can now access all features.'
          : 'Your account could not be approved. Please contact support.',
        data: {
          status,
          reason
        }
      });

      // Send WhatsApp notification
      const whatsappSuccess = await whatsappService.sendApprovalNotification(
        user.phone,
        { status, reason }
      );

      return whatsappSuccess;
    } catch (error) {
      console.error('Error sending approval notification:', error);
      return false;
    }
  }

  async sendMeetingConfirmation(
    customerId: string,
    agentId: string,
    propertyTitle: string,
    agentName: string,
    meetingTime: string,
    location?: string
  ): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      
      // Get customer phone number
      const { data: customer } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', customerId)
        .single();

      if (!customer?.phone) {
        console.error('Customer phone number not found');
        return false;
      }

      // Create app notification
      await this.createNotification({
        user_id: customerId,
        type: 'meeting_scheduled',
        title: 'Meeting Confirmed',
        message: `Your property visit for ${propertyTitle} has been confirmed.`,
        data: {
          property_title: propertyTitle,
          agent_name: agentName,
          meeting_time: meetingTime,
          location
        }
      });

      // Send WhatsApp confirmation
      const whatsappSuccess = await whatsappService.sendMeetingConfirmation(
        customer.phone,
        {
          property_title: propertyTitle,
          agent_name: agentName,
          meeting_time: meetingTime,
          location
        }
      );

      return whatsappSuccess;
    } catch (error) {
      console.error('Error sending meeting confirmation:', error);
      return false;
    }
  }

  async getUserNotifications(userId: string, limit: number = 20): Promise<any[]> {
    try {
      const supabase = await this.getSupabase();
      
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*, user:profiles!notifications_user_id_fkey(*)')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return notifications || [];
    } catch (error) {
      console.error('Error in getUserNotifications:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markNotificationAsRead:', error);
      return false;
    }
  }

  // Schedule appointment reminders (to be called by a cron job)
  async scheduleAppointmentReminders(): Promise<void> {
    try {
      const supabase = await this.getSupabase();
      
      // Get appointments scheduled for 30 minutes from now
      const reminderTime = new Date();
      reminderTime.setMinutes(reminderTime.getMinutes() + 30);

      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          *,
          customer:profiles(*),
          agent:profiles(*),
          property_interest:property_interests(
            property:properties(*)
          )
        `)
        .eq('status', 'scheduled')
        .gte('scheduled_at', reminderTime.toISOString())
        .lt('scheduled_at', new Date(reminderTime.getTime() + 5 * 60 * 1000).toISOString()); // 5 minute window

      if (appointments) {
        for (const appointment of appointments) {
          await this.sendAppointmentReminder(
            appointment.customer_id,
            appointment.agent_id,
            appointment.property_interest?.property?.title || 'Property',
            `${appointment.agent?.first_name} ${appointment.agent?.last_name}`,
            appointment.scheduled_at,
            appointment.location
          );
        }
      }
    } catch (error) {
      console.error('Error scheduling appointment reminders:', error);
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
