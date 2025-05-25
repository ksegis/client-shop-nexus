
import { useToast } from '@/hooks/use-toast';

export function usePasswordReset(refetchUsers: () => Promise<void>) {
  const { toast } = useToast();

  const resetPassword = async (userId: string, email: string, newPassword: string) => {
    try {
      console.log(`Mock password reset for user: ${email}`);
      
      toast({
        title: "Password reset successfully",
        description: `Password has been reset for ${email}`,
      });

      await refetchUsers();
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error resetting password",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
      throw error;
    }
  };

  return { resetPassword };
}
