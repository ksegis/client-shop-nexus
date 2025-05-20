
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const usePasswordReset = (refetchUsers: () => Promise<void>) => {
  const resetPassword = async (userId: string, email: string, newPassword: string) => {
    try {
      // 1. Update the user's password via admin functions
      // In a real application, this would use the Supabase admin API
      // Here we're going to set the force_password_change flag
      
      // Update the force_password_change flag using RPC
      const { error: updateError } = await supabase
        .rpc('update_password_change_flag', {
          user_id: userId,
          force_change: true
        });
        
      if (updateError) throw updateError;
      
      // For real password reset, we can use the auth.admin.updateUserById API
      // But in this application, we'll simulate by sending the user a reset link
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth/change-password'
      });
        
      if (resetError) throw resetError;
      
      toast({
        title: "Password Reset",
        description: `Password reset email sent to ${email}. They will be required to change their password on next login.`,
      });
      
      await refetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    }
  };

  return { resetPassword };
};
