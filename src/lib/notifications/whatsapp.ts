// WhatsApp notification service using Meta Business API
// This is a placeholder implementation - in production, you would integrate with the actual Meta WhatsApp Business API

interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template';
  content?: string;
  template?: {
    name: string;
    language: { code: string };
    components: any[];
  }
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
  private phoneNumberId: string;
  private isConfigured: boolean;

  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.isConfigured = !!(this.accessToken && this.phoneNumberId && this.apiUrl.startsWith('https'));
  }

  static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  async sendMessage(message: WhatsAppMessage): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('WhatsApp Service is not configured. Simulating message sending. Please set WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, and WHATSAPP_API_URL environment variables.');
      console.log('Simulated WhatsApp message:', message);
      return this.simulateWhatsAppAPI(message);
    }
    
    try {
      const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: this.formatPhoneNumber(message.to),
          type: message.type,
          text: message.type === 'text' ? { body: message.content } : undefined,
          template: message.type === 'template' ? message.template : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error sending WhatsApp message:', errorData);
        return false;
      }

      console.log('WhatsApp message sent successfully.');
      return true;
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

  private formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  async sendPropertyInterestNotification(
    phoneNumber: string,
    data: WhatsAppNotificationData['property_interest']
  ): Promise<boolean> {
    if (!data) return false;

    const message = `🏠 *Property Interest Confirmation*

Hello! Thank you for your interest in *${data.property_title}*.

💰 Price: ${this.formatCurrency(data.property_price)}
👤 Your assigned agent: ${data.agent_name}
📅 Meeting scheduled for: ${data.meeting_time}

We'll send you a reminder 30 minutes before your meeting. If you need to reschedule, please contact us.

Thank you for choosing EstateFlow!`;

    return this.sendSimpleMessage(phoneNumber, message);
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

    return this.sendSimpleMessage(phoneNumber, message);
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

    return this.sendSimpleMessage(phoneNumber, message);
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

    return this.sendSimpleMessage(phoneNumber, message);
  }

  private async simulateWhatsAppAPI(message: WhatsAppMessage): Promise<{ success: boolean }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate success/failure (95% success rate)
    const isSuccess = Math.random() > 0.05;

    if (isSuccess) {
      console.log(`✅ Simulated WhatsApp message sent to ${message.to}`);
      return { success: true };
    } else {
      console.log(`❌ Failed to simulate sending WhatsApp message to ${message.to}`);
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
