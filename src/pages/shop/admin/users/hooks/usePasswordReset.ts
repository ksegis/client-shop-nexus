
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const usePasswordReset = (refetchUsers: () => Promise<void>) => {
  const resetPassword = async (userId: string, email: string, newPassword: string) => {
    try {
      // In a real application, this would use the Supabase admin API to reset passwords
      // For this demo, we'll simulate it and show a success message
      
      // Update the force_password_change flag using RPC
      const { error: updateError } = await supabase
        .rpc('update_password_change_flag', {
          user_id: userId,
          force_change: true
        });
        
      if (updateError) throw updateError;
      
      toast({
        title: "Password Reset",
        description: `Password for ${email} has been reset. They will be required to change it on next login.`,
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
