
import { useSignUp } from './useSignUp';
import { useSignIn } from './useSignIn';
import { useSignOut } from './useSignOut';
import { usePasswordReset } from './usePasswordReset';
import { useDevImpersonation } from './useDevImpersonation';

export function useAuthMethods() {
  const { signUp } = useSignUp();
  const { signIn } = useSignIn();
  const { signOut } = useSignOut();
  const { resetPassword } = usePasswordReset();
  const { impersonateCustomer } = useDevImpersonation();

  return {
    signUp,
    signIn,
    signOut,
    resetPassword,
    impersonateCustomer
  };
}
