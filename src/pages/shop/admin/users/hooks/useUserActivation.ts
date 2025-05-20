
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useUserActivation = (refetchUsers: () => Promise<void>) => {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const toggleUserActive = async (userId: string, currentRole: string) => {
    try {
      setLoading(userId);

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
      setLoading(null);
    }
  };

  const deleteUser = async (userId: string, email: string) => {
    try {
      setLoading(userId);

      // Call the Edge Function to delete the auth user
      const { data, error } = await supabase.functions.invoke('delete-auth-user', {
        body: { userId }
      });

      if (error) throw error;
      
      toast({
        title: "User Deleted",
        description: `User ${email} has been permanently deleted`,
      });

      // Refresh the user list
      await refetchUsers();
      return true;
    } catch (error: any) {
      console.error('Error deleting user:', error);
      
      toast({
        title: "Delete Failed",
        description: error.message || "Could not delete user",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(null);
    }
  };

  return {
    loading,
    toggleUserActive,
    deleteUser
  };
};
