
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthResult, UserRole } from '../types';
import { useAuthMethods } from './useAuthMethods';
import { useAuthLogging } from './useAuthLogging';
import { useToast } from '@/hooks/use-toast';

export function useAuthActions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    signUp: authSignUp, 
    signIn: authSignIn, 
    signOut: authSignOut,
    resetPassword: authResetPassword 
  } = useAuthMethods();
  const { logAuthEvent } = useAuthLogging();

  const signUp = async (email: string, password: string, firstName = '', lastName = ''): Promise<AuthResult> => {
    try {
      const metadata = { 
        first_name: firstName, 
        last_name: lastName, 
        role: 'customer' as UserRole 
      };
      
      const result = await authSignUp({ email, password, metadata });
      
      if (!result.success) throw result.error;
      
      // Create profile for new user (important for RLS policies)
      if (result.data?.user) {
        await supabase.from('profiles').insert({
          id: result.data.user.id,
          email,
          role: 'customer',
          first_name: firstName,
          last_name: lastName
        });
        
        // Log the signup event
        await logAuthEvent('sign_up', result.data.user);
      }
      
      return { success: true, data: result.data };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { success: false, error };
    }
  };
  
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
          
          // Get user profile to determine redirect path
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role, force_password_change')
            .eq('id', result.data.user.id)
            .single();
          
          if (profileError) {
            console.error('Error fetching profile:', profileError);
            toast({
              variant: "destructive",
              title: "Login error",
              description: "Could not retrieve user profile"
            });
            return { success: false, error: profileError };
          }
          
          if (profileData) {
            // Check if password change is required
            if (profileData.force_password_change) {
              console.log('Password change required, redirecting to change-password page');
              navigate('/auth/change-password', { replace: true });
              
              toast({
                title: "Password change required",
                description: "Please change your password to continue"
              });
              
              return result;
            }
            
            // Log the detected role and intended redirect path
            const redirectPath = getRedirectPathByRole(profileData.role as UserRole);
            console.log(`User role: ${profileData.role}, redirecting to: ${redirectPath}`);
            
            // Show success toast
            toast({
              title: "Login successful",
              description: `Welcome to your ${profileData.role} portal!`
            });
            
            // Redirect the user to the appropriate dashboard with a slight delay to ensure state is updated
            setTimeout(() => {
              console.log(`Executing navigation to ${redirectPath}`);
              navigate(redirectPath, { replace: true });
            }, 100);
          } else {
            console.error('No profile data found for user');
            toast({
              variant: "destructive",
              title: "Login error",
              description: "User profile not found"
            });
            return { success: false, error: new Error('No profile found for user') };
          }
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
        
        // Force redirect to home page
        navigate('/', { replace: true });
      }
      
      return result;
    } catch (error: any) {
      console.error('Sign out error:', error);
      return { success: false, error };
    }
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    return await authResetPassword(email);
  };

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
      }
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error };
    }
  };

  const getRedirectPathByRole = (role: UserRole) => {
    switch (role) {
      case 'customer':
        return '/customer';
      case 'admin':
      case 'staff':
        return '/shop';
      default:
        return '/';
    }
  };

  return {
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    getRedirectPathByRole,
  };
}
