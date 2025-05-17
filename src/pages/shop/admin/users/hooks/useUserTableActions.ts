
import { useState } from 'react';
import { useUserManagement } from '../UserManagementContext';
import { useImpersonation } from '@/utils/admin/impersonationUtils';
import { toast } from "@/hooks/use-toast";
import { User } from '../types';
import { isRoleInactive } from '../utils';

export const useUserTableActions = () => {
  const { users, toggleUserActive } = useUserManagement();
  const { impersonateUser } = useImpersonation();
  const [impersonationLoading, setImpersonationLoading] = useState<string | null>(null);
  const [activationLoading, setActivationLoading] = useState<string | null>(null);

  // Find invited by names
  const getInviterName = (invitedById: string | null | undefined) => {
    if (!invitedById) return "—";
    const inviter = users.find(user => user.id === invitedById);
    return inviter ? `${inviter.first_name} ${inviter.last_name}` : "Unknown";
  };

  const handleImpersonate = async (userId: string, email: string) => {
    try {
      setImpersonationLoading(userId);
      const userName = users.find(u => u.id === userId)?.first_name || email;
      
      // Call impersonation utility
      const success = await impersonateUser(userId, userName);
      
      if (!success) {
        throw new Error('Failed to impersonate user');
      }
      
    } catch (error) {
      console.error('Impersonation error:', error);
      toast({
        title: 'Impersonation failed',
        description: 'There was an error impersonating this user.',
        variant: 'destructive',
      });
    } finally {
      setImpersonationLoading(null);
    }
  };

  const handleToggleActive = async (userId: string, currentRole: string) => {
    try {
      setActivationLoading(userId);
      
      await toggleUserActive(userId, currentRole);
      
      const isCurrentlyActive = !isRoleInactive(currentRole);
      toast({
        title: isCurrentlyActive ? "User Deactivated" : "User Activated",
        description: isCurrentlyActive 
          ? "The user has been successfully deactivated." 
          : "The user has been successfully activated.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating user status",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setActivationLoading(null);
    }
  };

  return {
    impersonationLoading,
    activationLoading,
    getInviterName,
    handleImpersonate,
    handleToggleActive
  };
};
