
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuditLogger } from './useAuditLogger';

export const usePasswordReset = () => {
  const { toast } = useToast();
  const { logAuditEvent } = useAuditLogger();

  const sendPasswordReset = async (email: string, targetUserId?: string) => {
    try {
      // Use the correct redirect URL that points directly to the change password page
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/change-password`
      });

      if (error) throw error;

      // Log the password reset action
      if (targetUserId) {
        await logAuditEvent('reset_password', targetUserId, `Password reset email sent to ${email}`);
      }

      toast({
        title: "Success",
        description: "Password reset email sent successfully"
      });

    } catch (error: any) {
      console.error('Error sending password reset:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email",
        variant: "destructive"
      });
      throw error;
    }
  };

  return { sendPasswordReset };
};
