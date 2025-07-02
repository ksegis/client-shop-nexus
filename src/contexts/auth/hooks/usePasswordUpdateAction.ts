
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AuthResult, UserRole } from '../types';
import { useAuthLogging } from './useAuthLogging';
import { useAuthRedirection } from './useAuthRedirection';
import { useToast } from '@/hooks/use-toast';

export function usePasswordUpdateAction() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logAuthEvent } = useAuthLogging();
  const { getRedirectPathByRole } = useAuthRedirection();

  const updatePassword = async (password: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      // Update force_password_change flag to false
      if (data?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ force_password_change: false })
          .eq('id', data.user.id);
          
        if (profileError) throw profileError;
        
        // Log the password update
        await logAuthEvent('password_update', data.user);
        
        toast({
          title: "Password updated",
          description: "Your password has been successfully updated"
        });
        
        // Navigate to appropriate page after password change
        setTimeout(async () => {
          // Get user profile to determine redirect path
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();
            
          const redirectPath = getRedirectPathByRole(profileData?.role as UserRole || 'customer');
          console.log(`Navigating to ${redirectPath} after password change`);
          navigate(redirectPath, { replace: true });
        }, 500);
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Password update error:', error);
      toast({
        variant: "destructive",
        title: "Password update failed",
        description: error.message || "Failed to update password"
      });
      return { success: false, error };
    }
  };

  return { updatePassword };
}
