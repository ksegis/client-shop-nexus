
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthResult, UserRole, mapRoleToDbRole } from '../types';
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
          last_name: lastName,
          is_test_account: false
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
    const result = await authSignIn({ email, password });
    
    if (result.success && result.data?.user) {
      // Log the signin event
      await logAuthEvent('sign_in', result.data.user);
    }
    
    return result;
  };
  
  const signOut = async (isTestUser = false): Promise<AuthResult> => {
    // If in test user mode, just clear the localStorage
    if (isTestUser) {
      localStorage.removeItem('test-user-mode');
      window.location.reload();
      return { success: true };
    }
    
    try {
      // Get the current user before signing out
      const { data: { user } } = await supabase.auth.getUser();
      
      const result = await authSignOut();
      
      if (result.success) {
        // Log the signout event if we had a user
        if (user) {
          await logAuthEvent('sign_out', user);
        }
        
        navigate('/auth');
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
    // For test roles, look at the base role
    const baseRole = role.startsWith('test_') ? 
      role.replace('test_', '') as UserRole : 
      role;
    
    switch (baseRole) {
      case 'customer':
        return '/customer/profile';
      case 'admin':
        return '/shop/admin';
      case 'staff':
        return '/shop';
      default:
        return '/auth';
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
