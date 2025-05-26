
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
          
          // Get user profile to determine redirect path - force a fresh fetch
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role, force_password_change, email')
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
            console.log(`Profile data fetched for ${profileData.email}:`, {
              role: profileData.role,
              force_password_change: profileData.force_password_change
            });
            
            // Check if password change is required
            if (profileData.force_password_change) {
              console.log('Password change required, redirecting to change-password page');
              
              toast({
                title: "Password change required",
                description: "Please change your password to continue"
              });
              
              // Add delay before navigation to ensure toast is shown
              setTimeout(() => {
                console.log('Navigating to change-password page');
                navigate('/auth/change-password', { replace: true });
              }, 500);
              
              return result;
            }
            
            // Log the detected role and intended redirect path
            const redirectPath = getRedirectPathByRole(profileData.role as UserRole);
            console.log(`User ${profileData.email} has role: ${profileData.role}, redirecting to: ${redirectPath}`);
            
            // Show success toast
            toast({
              title: "Login successful",
              description: `Welcome to your ${getPortalDisplayName(profileData.role as UserRole)} portal!`
            });
            
            // Add debug logging
            console.log(`Preparing to navigate to ${redirectPath}`);
            
            // Use consistent navigation approach with delay to ensure toast is shown
            setTimeout(() => {
              console.log(`Executing navigation to ${redirectPath} for user with role ${profileData.role}`);
              navigate(redirectPath, { replace: true });
            }, 500);
            
            return result;
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

  const resetPassword = async (email: string): Promise<AuthResult> => {
    console.log('=== AUTH ACTIONS RESET PASSWORD START ===');
    console.log('Reset password called for email:', email);
    console.log('Timestamp:', new Date().toISOString());
    
    try {
      const result = await authResetPassword(email);
      console.log('Auth methods resetPassword result:', result);
      console.log('=== AUTH ACTIONS RESET PASSWORD END ===');
      return result;
    } catch (error) {
      console.error('=== AUTH ACTIONS RESET PASSWORD ERROR ===');
      console.error('Error in useAuthActions resetPassword:', error);
      console.error('=== AUTH ACTIONS RESET PASSWORD ERROR END ===');
      return { success: false, error };
    }
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

  const getRedirectPathByRole = (role: UserRole) => {
    console.log(`Determining redirect path for role: ${role}`);
    switch (role) {
      case 'customer':
        return '/customer/dashboard';
      case 'admin':
      case 'staff':
        return '/shop/dashboard';
      default:
        console.warn(`Unknown role: ${role}, defaulting to customer portal`);
        return '/customer/dashboard';
    }
  };

  const getPortalDisplayName = (role: UserRole) => {
    switch (role) {
      case 'customer':
        return 'customer';
      case 'admin':
      case 'staff':
        return 'shop management';
      default:
        return 'customer';
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
