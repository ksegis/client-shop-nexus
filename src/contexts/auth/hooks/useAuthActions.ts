
import { AuthResult } from '../types';
import { useSignUpAction } from './useSignUpAction';
import { useSignInAction } from './useSignInAction';
import { useSignOutAction } from './useSignOutAction';
import { usePasswordResetAction } from './usePasswordResetAction';
import { usePasswordUpdateAction } from './usePasswordUpdateAction';
import { useAuthRedirection } from './useAuthRedirection';

export function useAuthActions() {
  const { signUp } = useSignUpAction();
  const { signIn } = useSignInAction();
  const { signOut } = useSignOutAction();
  const { resetPassword } = usePasswordResetAction();
  const { updatePassword } = usePasswordUpdateAction();
  const { getRedirectPathByRole } = useAuthRedirection();

  return {
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    getRedirectPathByRole,
  };
}
