
import { AuthResult } from '../types';
import { useAuthMethods } from './useAuthMethods';

export function usePasswordResetAction() {
  const { resetPassword: authResetPassword } = useAuthMethods();

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

  return { resetPassword };
}
