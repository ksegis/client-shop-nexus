
import { supabase } from '@/integrations/supabase/client';
import { AuthResult, UserRole } from '../types';
import { useAuthMethods } from './useAuthMethods';
import { useAuthLogging } from './useAuthLogging';
import { useAuthRedirection } from './useAuthRedirection';
import { useToast } from '@/hooks/use-toast';

export function useSignInAction() {
  const { toast } = useToast();
  const { signIn: authSignIn } = useAuthMethods();
  const { logAuthEvent } = useAuthLogging();
  const { handlePostSignInRedirection } = useAuthRedirection();

  const signIn = async (email: string, password: string, rememberMe = false): Promise<AuthResult> => {
    try {
      console.log(`Attempting sign in with email: ${email}, rememberMe: ${rememberMe}`);
      
      if (!email || !password) {
        const errorMsg = 'Email and password are required';
        toast({
          variant: "destructive",
          title: "Login failed",
          description: errorMsg
        });
        return { success: false, error: new Error(errorMsg) };
      }
      
      // Call the authentication method
      const result = await authSignIn({ email, password });
      
      if (!result.success) {
        console.error('Authentication failed:', result.error);
        return result;
      }
      
      if (result.success && result.data?.user) {
        try {
          // Log the signin event
          await logAuthEvent('sign_in', result.data.user);
          console.log(`Sign in successful for user: ${result.data.user.id}`);
          
          // Handle post sign-in redirection
          await handlePostSignInRedirection(result.data.user);
          
          return result;
        } catch (error: any) {
          console.error('Post-authentication error:', error);
          toast({
            variant: "destructive",
            title: "Login error",
            description: error.message || "An error occurred after authentication"
          });
          return { success: false, error };
        }
      }
      
      return result;
    } catch (error: any) {
      console.error('Sign in process error:', error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Authentication failed"
      });
      return { success: false, error };
    }
  };

  return { signIn };
}
