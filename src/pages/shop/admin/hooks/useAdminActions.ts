
import { useUserCreation } from './useUserCreation';
import { useUserUpdate } from './useUserUpdate';
import { usePasswordReset } from './usePasswordReset';
import { useUserDeletion } from './useUserDeletion';

export const useAdminActions = () => {
  const { createUser } = useUserCreation();
  const { updateUser, toggleUserStatus } = useUserUpdate();
  const { sendPasswordReset } = usePasswordReset();
  const { deleteUser } = useUserDeletion();

  return {
    createUser,
    updateUser,
    toggleUserStatus,
    sendPasswordReset,
    deleteUser
  };
};
