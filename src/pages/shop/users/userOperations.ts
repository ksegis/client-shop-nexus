
import { supabase } from '@/integrations/supabase/client';
import { User } from './types';
import { useToast } from '@/hooks/use-toast';
import { ExtendedUserRole } from '@/integrations/supabase/types-extensions';

export const useUserOperations = (refetch: () => Promise<void>) => {
  const { toast } = useToast();

  const createUser = async (user: Partial<User>, password: string) => {
    try {
      // Sign up the user with email and password
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: user.email || '',
        password: password,
        options: {
          data: {
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            phone: user.phone || '',
            role: user.role || 'customer',
          },
        },
      });
      
      if (signUpError) throw signUpError;

      // Directly update the profile since signUp already creates it
      if (authData?.user) {
        const role = (user.role || 'customer') as ExtendedUserRole;
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            role: role,
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

  const updateUser = async (id: string, user: Partial<User>, password?: string) => {
    try {
      // Update profile data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          role: user.role as ExtendedUserRole,
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
      let newRole: ExtendedUserRole;
      
      // Toggle between active and inactive states
      switch (currentRole) {
        case 'staff':
          newRole = 'inactive_staff';
          break;
        case 'admin':
          newRole = 'inactive_admin';
          break;
        case 'inactive_staff':
          newRole = 'staff';
          break;
        case 'inactive_admin':
          newRole = 'admin';
          break;
        case 'customer':
          // Optionally handle customers differently if needed
          newRole = currentRole as ExtendedUserRole;
          toast({
            description: "Customer accounts cannot be deactivated in this demo",
          });
          return;
        default:
          newRole = currentRole as ExtendedUserRole;
      }
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      await refetch();
      
      const actionText = newRole.startsWith('inactive_') ? 'deactivated' : 'reactivated';
      toast({
        title: "Success",
        description: `User ${actionText} successfully`,
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
