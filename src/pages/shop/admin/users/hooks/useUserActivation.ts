import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useUserActivation = (refetchUsers: () => Promise<void>) => {
  const toggleUserActive = async (userId: string, currentRole: string) => {
    try {
      let newRole;
      
      // Toggle between active and inactive states based on current role
      if (currentRole.startsWith('inactive_')) {
        // Activate: remove 'inactive_' prefix
        newRole = currentRole.replace('inactive_', '');
      } else if (currentRole === 'admin' || currentRole === 'staff') {
        // Deactivate: add 'inactive_' prefix 
        newRole = `inactive_${currentRole}`;
      } else {
        // For other roles like 'customer', we don't have an inactive variant in the database
        // so we'll just keep the original role
        newRole = currentRole;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast({
        title: currentRole.startsWith('inactive_') ? "User Activated" : "User Deactivated",
        description: currentRole.startsWith('inactive_') 
          ? "The user has been successfully activated." 
          : "The user has been successfully deactivated.",
      });
      
      await refetchUsers();
    } catch (error: any) {
      toast({
        title: "Error updating user status",
        description: error.message || "An unexpected error occurred",
      });
      throw error;
    }
  };

  return { toggleUserActive };
};
