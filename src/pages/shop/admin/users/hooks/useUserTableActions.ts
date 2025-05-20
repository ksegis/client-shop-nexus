
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserImpersonation } from './useUserImpersonation';
import { useUserManagement } from '../UserManagementContext';

export const useUserTableActions = () => {
  const [activationLoading, setActivationLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const { refetchUsers, deleteUser } = useUserManagement();
  const { impersonateUser, impersonationLoading } = useUserImpersonation();

  const getInviterName = async (invitedById: string | null | undefined): Promise<string> => {
    if (!invitedById) return 'Direct Signup';

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', invitedById)
        .single();

      if (error || !data) {
        return 'Unknown';
      }

      const name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
      return name || 'Unknown';
    } catch (error) {
      console.error('Error fetching inviter name:', error);
      return 'Unknown';
    }
  };

  const handleImpersonate = async (userId: string, email: string) => {
    await impersonateUser(userId, email);
  };
  
  const handleDeleteUser = async (userId: string, email: string) => {
    setDeleteLoading(userId);
    try {
      const success = await deleteUser(userId, email);
      return success;
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleToggleActive = async (userId: string, currentRole: string) => {
    try {
      setActivationLoading(userId);

      // Check if the role is already inactive
      const isInactive = currentRole.startsWith('inactive_');
      
      let newRole;
      if (isInactive) {
        // Activate: Remove inactive_ prefix
        newRole = currentRole.replace('inactive_', '');
      } else {
        // Deactivate: Add inactive_ prefix
        newRole = `inactive_${currentRole}`;
      }

      // Update the user's role in the database
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      toast({
        title: isInactive ? "User Activated" : "User Deactivated",
        description: isInactive 
          ? "User account has been successfully activated" 
          : "User account has been successfully deactivated",
        variant: "default",
      });

      // Refresh the user list
      await refetchUsers();
    } catch (error: any) {
      console.error('Error toggling user active status:', error);
      
      toast({
        title: "Action Failed",
        description: error.message || "Could not update user status",
        variant: "destructive",
      });
    } finally {
      setActivationLoading(null);
    }
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
};
