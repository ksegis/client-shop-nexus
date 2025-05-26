
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthResult } from '../types';
import { useAuthMethods } from './useAuthMethods';
import { useAuthLogging } from './useAuthLogging';
import { useToast } from '@/hooks/use-toast';

export function useSignOutAction() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut: authSignOut } = useAuthMethods();
  const { logAuthEvent } = useAuthLogging();

  const signOut = async (): Promise<AuthResult> => {
    try {
      // Get the current user before signing out
      const { data: { user } } = await supabase.auth.getUser();
      
      const result = await authSignOut();
      
      if (result.success) {
        // Log the signout event if we had a user
        if (user) {
          await logAuthEvent('sign_out', user);
        }
        
        toast({
          title: "Logged out",
          description: "You have been successfully logged out"
        });
        
        // Use consistent navigation approach with delay
        setTimeout(() => {
          console.log('Navigating to home page after logout');
          navigate('/', { replace: true });
        }, 500);
      }
      
      return result;
    } catch (error: any) {
      console.error('Sign out error:', error);
      return { success: false, error };
    }
  };

  return { signOut };
}
