
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface NotificationEmailParams {
  to: string;
  subject: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

export const useEmailNotifications = () => {
  const { toast } = useToast();

  const sendNotification = async (params: NotificationEmailParams) => {
    try {
      console.log('Sending notification email:', params);

      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: params
      });

      if (error) {
        console.error('Notification email error:', error);
        toast({
          title: "Email Error",
          description: "Failed to send notification email",
          variant: "destructive"
        });
        return { success: false, error };
      }

      console.log('Notification email sent successfully:', data);
      return { success: true, data };
    } catch (error: any) {
      console.error('Email notification service error:', error);
      toast({
        title: "Email Error",
        description: error.message || "Failed to send notification email",
        variant: "destructive"
      });
      return { success: false, error };
    }
  };

  const sendWelcomeEmail = async (email: string, firstName: string) => {
    return sendNotification({
      to: email,
      subject: 'Welcome to Shop Management System',
      type: 'success',
      title: 'Welcome!',
      message: `Hello ${firstName}! Your account has been successfully created. You can now access all the features of our Shop Management System.`,
      actionUrl: `${window.location.origin}/shop/dashboard`,
      actionText: 'Go to Dashboard'
    });
  };

  const sendPasswordChangeNotification = async (email: string) => {
    return sendNotification({
      to: email,
      subject: 'Password Changed Successfully',
      type: 'info',
      title: 'Password Updated',
      message: 'Your password has been successfully changed. If you did not make this change, please contact support immediately.',
      actionUrl: `${window.location.origin}/shop/profile`,
      actionText: 'View Profile'
    });
  };

  const sendSecurityAlert = async (email: string, alertType: string, details: string) => {
    return sendNotification({
      to: email,
      subject: 'Security Alert - Shop Management System',
      type: 'warning',
      title: 'Security Alert',
      message: `Security alert: ${alertType}. Details: ${details}. If this wasn't you, please change your password immediately.`,
      actionUrl: `${window.location.origin}/auth/change-password`,
      actionText: 'Change Password'
    });
  };

  return {
    sendNotification,
    sendWelcomeEmail,
    sendPasswordChangeNotification,
    sendSecurityAlert
  };
};
