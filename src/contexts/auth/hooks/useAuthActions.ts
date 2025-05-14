
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthResult } from '../types';
import { useAuthMethods } from './useAuthMethods';

export function useAuthActions() {
  const navigate = useNavigate();
  const { signUp: authSignUp, signIn: authSignIn, signOut: authSignOut, impersonateCustomer: authImpersonateCustomer } = useAuthMethods();

  const signUp = async (email: string, password: string, firstName = '', lastName = ''): Promise<AuthResult> => {
    try {
      const metadata = { first_name: firstName, last_name: lastName, role: 'customer' };
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
      }
      
      return { success: true, data: result.data };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { success: false, error };
    }
  };
  
  const signIn = async (email: string, password: string, rememberMe = false): Promise<AuthResult> => {
    return await authSignIn({ email, password });
  };
  
  const signOut = async (useDevCustomer = false): Promise<AuthResult> => {
    // If in dev customer mode, clear the localStorage
    if (useDevCustomer) {
      localStorage.removeItem('dev-customer-user');
      window.location.reload();
      return { success: true };
    }
    
    const result = await authSignOut();
    
    if (result.success) {
      navigate('/auth');
    }
    
    return result;
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/customer/reset-password'
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error };
    }
  };

  const updatePassword = async (password: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error };
    }
  };

  const getRedirectPathByRole = (role: string) => {
    return role === 'customer' ? '/customer/profile' : '/shop';
  };

  const impersonateCustomer = () => {
    authImpersonateCustomer();
  };

  return {
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    getRedirectPathByRole,
    impersonateCustomer
  };
}
