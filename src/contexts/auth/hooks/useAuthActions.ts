
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthResult, UserRole } from '../types';
import { useAuthMethods } from './useAuthMethods';
import { useAuthLogging } from './useAuthLogging';

export function useAuthActions() {
  const navigate = useNavigate();
  const { 
    signUp: authSignUp, 
    signIn: authSignIn, 
    signOut: authSignOut 
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
      console.log(`Signing in with email: ${email}, rememberMe: ${rememberMe}`);
      const result = await authSignIn({ email, password });
      
      if (result.success && result.data?.user) {
        // Log the signin event
        await logAuthEvent('sign_in', result.data.user);
        console.log(`Sign in successful for user: ${result.data.user.id}`);
        
        // Get user profile to determine redirect path
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', result.data.user.id)
          .single();
        
        if (profileData?.role) {
          const redirectPath = getRedirectPathByRole(profileData.role as UserRole);
          console.log(`User role: ${profileData.role}, redirecting to: ${redirectPath}`);
        }
      }
      
      return result;
    } catch (error: any) {
      console.error('Sign in error:', error);
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
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/customer/reset-password'
      });
      
      if (error) throw error;
      
      // Log the password reset request (we don't have a user object here)
      await logAuthEvent('password_reset', null, { email });
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error };
    }
  };

  const updatePassword = async (password: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      // Log the password update
      if (data?.user) {
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
        return '/shop';
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
