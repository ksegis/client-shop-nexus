
import { useUserManagement } from '../UserManagementContext';

export function useUserTableActions() {
  const { 
    impersonateUser, 
    toggleUserActive, 
    deleteUser,
    impersonationLoading 
  } = useUserManagement();

  const activationLoading = null; // For mock implementation
  const deleteLoading = null; // For mock implementation

  const getInviterName = (inviterId: string | null): string => {
    if (!inviterId) return 'System';
    return 'Admin'; // Mock implementation
  };

  const handleImpersonate = async (userId: string, email: string) => {
    return await impersonateUser(userId, email);
  };

  const handleToggleActive = async (userId: string, currentRole: string) => {
    return await toggleUserActive(userId, currentRole);
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    return await deleteUser(userId, email);
  };

  return {
    impersonationLoading,
    activationLoading,
    deleteLoading,
    getInviterName,
    handleImpersonate,
    handleToggleActive,
    handleDeleteUser
  };
}
