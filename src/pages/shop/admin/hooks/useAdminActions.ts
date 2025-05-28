
import { useUserCreation } from './useUserCreation';
import { useUserUpdate } from './useUserUpdate';
import { usePasswordReset } from './usePasswordReset';
import { useUserDeletion } from './useUserDeletion';
import { useQueryClient } from '@tanstack/react-query';

export const useAdminActions = () => {
  const queryClient = useQueryClient();
  const { createUser } = useUserCreation();
  const { updateUser, toggleUserStatus } = useUserUpdate();
  const { sendPasswordReset } = usePasswordReset();
  const { deleteUser: deleteUserBase } = useUserDeletion();

  const deleteUser = async (userId: string) => {
    await deleteUserBase(userId);
    // Invalidate and refetch users data after successful deletion
    await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    await queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  return {
    createUser,
    updateUser,
    toggleUserStatus,
    sendPasswordReset,
    deleteUser
  };
};
