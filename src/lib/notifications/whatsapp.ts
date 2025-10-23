// WhatsApp notification service using Meta Business API
// This is a placeholder implementation - in production, you would integrate with the actual Meta WhatsApp Business API

interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template';
  content: string;
  templateName?: string;
  templateParams?: Record<string, string>;
}

interface WhatsAppNotificationData {
  property_interest?: {
    property_title: string;
    property_price: number;
    agent_name: string;
    meeting_time: string;
  };
  appointment_reminder?: {
    property_title: string;
    agent_name: string;
    meeting_time: string;
    location?: string;
  };
  approval_status?: {
    status: 'approved' | 'rejected';
    reason?: string;
  };
}

export class WhatsAppService {
  private static instance: WhatsAppService;
  private apiUrl: string;
  private accessToken: string;

  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
  }

  static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  async sendMessage(message: WhatsAppMessage): Promise<boolean> {
    try {
      // In production, this would make an actual API call to Meta WhatsApp Business API
      console.log('WhatsApp message would be sent:', message);
      
      // Simulate API call
      const response = await this.simulateWhatsAppAPI(message);
      return response.success;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }
  
  async sendSimpleMessage(phoneNumber: string, message: string): Promise<boolean> {
    return this.sendMessage({
      to: phoneNumber,
      type: 'text',
      content: message,
    });
  }

  async sendPropertyInterestNotification(
    phoneNumber: string,
    data: WhatsAppNotificationData['property_interest']
  ): Promise<boolean> {
    if (!data) return false;

    const message = `🏠 *Property Interest Confirmation*

Hello! Thank you for your interest in *${data.property_title}*.

💰 Price: ₹${data.property_price.toLocaleString()}
👤 Your assigned agent: ${data.agent_name}
📅 Meeting scheduled for: ${data.meeting_time}

We'll send you a reminder 30 minutes before your meeting. If you need to reschedule, please contact us.

Thank you for choosing EstateFlow!`;

    return this.sendMessage({
      to: phoneNumber,
      type: 'text',
      content: message
    });
  }

  async sendAppointmentReminder(
    phoneNumber: string,
    data: WhatsAppNotificationData['appointment_reminder']
  ): Promise<boolean> {
    if (!data) return false;

    const message = `⏰ *Meeting Reminder*

Your property visit is scheduled in 30 minutes!

🏠 Property: *${data.property_title}*
👤 Agent: ${data.agent_name}
📅 Time: ${data.meeting_time}
${data.location ? `📍 Location: ${data.location}` : ''}

Please be ready for the meeting. If you need to reschedule, contact us immediately.

See you soon!`;

    return this.sendMessage({
      to: phoneNumber,
      type: 'text',
      content: message
    });
  }

  async sendApprovalNotification(
    phoneNumber: string,
    data: WhatsAppNotificationData['approval_status']
  ): Promise<boolean> {
    if (!data) return false;

    const message = data.status === 'approved' 
      ? `✅ *Account Approved*

Congratulations! Your EstateFlow account has been approved.

You can now:
• Browse verified property listings
• Express interest in properties
• Schedule property visits
• Connect with our agents

Visit our platform to get started!`
      : `❌ *Account Not Approved*

Unfortunately, your account could not be approved at this time.

${data.reason ? `Reason: ${data.reason}` : ''}

Please contact our support team for more information.`;

    return this.sendMessage({
      to: phoneNumber,
      type: 'text',
      content: message
    });
  }

  async sendMeetingConfirmation(
    phoneNumber: string,
    data: WhatsAppNotificationData['appointment_reminder']
  ): Promise<boolean> {
    if (!data) return false;

    const message = `📅 *Meeting Confirmed*

Your property visit has been confirmed!

🏠 Property: *${data.property_title}*
👤 Agent: ${data.agent_name}
📅 Date & Time: ${data.meeting_time}
${data.location ? `📍 Location: ${data.location}` : ''}

We'll send you a reminder 30 minutes before the meeting. Please arrive on time.

Looking forward to showing you this property!`;

    return this.sendMessage({
      to: phoneNumber,
      type: 'text',
      content: message
    });
  }

  private async simulateWhatsAppAPI(message: WhatsAppMessage): Promise<{ success: boolean }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate success/failure (95% success rate)
    const isSuccess = Math.random() > 0.05;

    if (isSuccess) {
      console.log(`✅ WhatsApp message sent to ${message.to}`);
      return { success: true };
    } else {
      console.log(`❌ Failed to send WhatsApp message to ${message.to}`);
      return { success: false };
    }
  }

  // Utility method to format phone numbers for WhatsApp
  formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present (assuming India +91)
    if (cleaned.length === 10) {
      return `91${cleaned}`;
    } else if (cleaned.startsWith('91') && cleaned.length === 12) {
      return cleaned;
    } else if (cleaned.startsWith('+91')) {
      return cleaned.substring(1);
    }
    
    return cleaned;
  }

  // Validate phone number format
  isValidPhoneNumber(phone: string): boolean {
    const formatted = this.formatPhoneNumber(phone);
    return formatted.length >= 10 && formatted.length <= 15;
  }
}

// Export singleton instance
export const whatsappService = WhatsAppService.getInstance();
