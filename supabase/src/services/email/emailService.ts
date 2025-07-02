
import { supabase } from '@/lib/supabase';

export interface EmailServiceResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  static async sendInvitation(params: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    token: string;
  }): Promise<EmailServiceResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: params
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.messageId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async sendPasswordReset(params: {
    email: string;
    resetUrl: string;
  }): Promise<EmailServiceResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: params
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.messageId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async sendNotification(params: {
    to: string;
    subject: string;
    type: 'info' | 'warning' | 'success' | 'error';
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
  }): Promise<EmailServiceResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: params
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.messageId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
