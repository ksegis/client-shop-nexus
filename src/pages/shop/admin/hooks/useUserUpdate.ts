
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuditLogger } from './useAuditLogger';
import { UpdateUserData } from './types';

export const useUserUpdate = () => {
  const { toast } = useToast();
  const { logAuditEvent } = useAuditLogger();

  const updateUser = async (userId: string, updates: UpdateUserData) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      await logAuditEvent('update_user', userId, 'Updated user profile', updates);

      toast({
        title: "Success",
        description: "User updated successfully"
      });

    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive"
      });
      throw error;
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      
      const { error } = await supabase
        .from('profiles')
        .update({ active: newStatus })
        .eq('id', userId);

      if (error) throw error;

      await logAuditEvent('toggle_status', userId, `${newStatus ? 'Activated' : 'Deactivated'} user`);

      toast({
        title: "Success",
        description: `User ${newStatus ? 'activated' : 'deactivated'} successfully`
      });

    } catch (error: any) {
      console.error('Error toggling user status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive"
      });
      throw error;
    }
  };

  return { updateUser, toggleUserStatus };
};
