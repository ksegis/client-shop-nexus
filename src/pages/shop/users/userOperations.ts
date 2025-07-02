
import { supabase } from '@/lib/supabase';
import { User } from './types';
import { ExtendedUserRole, mapExtendedRoleToDbRole } from '@/integrations/supabase/types-extensions';

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
      // Map the extended role to database role before saving
      const dbRole = mapExtendedRoleToDbRole(user.role as ExtendedUserRole);
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          role: dbRole
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
      // Map the extended role to database role before saving
      const dbRole = user.role ? mapExtendedRoleToDbRole(user.role as ExtendedUserRole) : undefined;
      
      // Update profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          role: dbRole
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
