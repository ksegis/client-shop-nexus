
import { supabase } from '@/lib/supabase';
import { AuthResult, UserRole } from '../types';
import { useAuthMethods } from './useAuthMethods';
import { useAuthLogging } from './useAuthLogging';

export function useSignUpAction() {
  const { signUp: authSignUp } = useAuthMethods();
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

  return { signUp };
}
