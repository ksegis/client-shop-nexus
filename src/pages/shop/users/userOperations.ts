
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExtendedUserRole, DatabaseUserRole, mapExtendedRoleToDbRole } from '@/integrations/supabase/types-extensions';

export const useUserOperations = (refetch: () => Promise<void>) => {
  const { toast } = useToast();

  const createUser = async (user, password: string) => {
    try {
      // Map user role to a valid database role
      const dbRole = mapExtendedRoleToDbRole(user.role as ExtendedUserRole);
      
      // Sign up the user with email and password
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: user.email || '',
        password: password,
        options: {
          data: {
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            phone: user.phone || '',
            role: dbRole,
          },
        },
      });
      
      if (signUpError) throw signUpError;

      // Directly update the profile since signUp already creates it
      if (authData?.user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            role: dbRole,
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            phone: user.phone || '',
          })
          .eq('id', authData.user.id);
        
        if (updateError) throw updateError;
      }
      
      await refetch();
      toast({
        title: "Success",
        description: "User created successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create user: ${error.message}`,
      });
      throw error;
    }
  };

  const updateUser = async (id: string, user, password?: string) => {
    try {
      // Map to a valid database role
      const dbRole = mapExtendedRoleToDbRole(user.role as ExtendedUserRole);
      
      // Update profile data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          role: dbRole,
        })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      // Update password if provided (this would require admin API in a real app)
      if (password && password.trim() !== '') {
        toast({
          description: "Password updates require admin API access and are simulated in this demo",
        });
      }
      
      await refetch();
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update user: ${error.message}`,
      });
      throw error;
    }
  };

  const toggleUserActive = async (id: string, currentRole: string) => {
    try {
      // Map to a valid database role based on toggles
      let dbRole: DatabaseUserRole = 'customer';
      
      // Toggle between active and inactive states
      switch (currentRole) {
        case 'customer':
          dbRole = 'customer';
          break;
        case 'staff':
          dbRole = 'staff';
          break;
        case 'admin':
          dbRole = 'admin';
          break;
        case 'inactive_staff':
          dbRole = 'staff';
          break;
        case 'inactive_admin':
          dbRole = 'admin';
          break;
        default:
          dbRole = 'customer';
      }
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: dbRole })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      await refetch();
      
      toast({
        title: "Success",
        description: `User status updated successfully`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update user status: ${error.message}`,
      });
      throw error;
    }
  };

  return {
    createUser,
    updateUser,
    toggleUserActive
  };
};
