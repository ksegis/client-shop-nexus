import { supabase } from '@/integrations/supabase/client';
import { User } from './types';

export const useUserOperations = (refetchUsers: () => Promise<void>) => {
  const createUser = async (user: Partial<User>, password: string) => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email!,
        password,
        options: {
          data: {
            first_name: user.first_name,
            last_name: user.last_name
          }
        }
      });
      
      if (authError) throw authError;
      
      // Create profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          role: user.role
        })
        .eq('id', authData.user?.id);
      
      if (profileError) throw profileError;
      
      await refetchUsers();
    } catch (error) {
      throw error;
    }
  };
  
  const updateUser = async (id: string, user: Partial<User>, password?: string) => {
    try {
      // Update profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          role: user.role
        })
        .eq('id', id);
      
      if (profileError) throw profileError;
      
      // Update password if provided
      if (password) {
        // In a real app, this would typically use an admin API to update the password
        console.log(`Password would be updated for user ${id}`);
      }
      
      await refetchUsers();
    } catch (error) {
      throw error;
    }
  };
  
  const toggleUserActive = async (id: string, currentRole: string) => {
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
        .eq('id', id);
      
      if (error) throw error;
      
      await refetchUsers();
    } catch (error) {
      throw error;
    }
  };

  return {
    createUser,
    updateUser,
    toggleUserActive
  };
};
