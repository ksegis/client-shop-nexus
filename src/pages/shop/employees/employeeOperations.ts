
import { supabase } from '@/integrations/supabase/client';
import { Employee, ExtendedRole } from './types';
import { useToast } from '@/hooks/use-toast';

export const useEmployeeOperations = (refetch: () => Promise<void>) => {
  const { toast } = useToast();

  const createEmployee = async (employee: Partial<Employee>, password: string) => {
    try {
      // Sign up the user with email and password
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: employee.email || '',
        password: password,
        options: {
          data: {
            first_name: employee.first_name || '',
            last_name: employee.last_name || '',
            phone: employee.phone || '',
            role: employee.role || 'staff',
          },
        },
      });
      
      if (signUpError) throw signUpError;

      // Directly update the profile since signUp already creates it
      if (authData?.user) {
        // Ensure the role is correctly typed
        const role: ExtendedRole = (employee.role || 'staff') as ExtendedRole;
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            role,
            first_name: employee.first_name || '',
            last_name: employee.last_name || '',
            phone: employee.phone || '',
          })
          .eq('id', authData.user.id);
        
        if (updateError) throw updateError;
      }
      
      await refetch();
      toast({
        title: "Success",
        description: "Employee created successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create employee: ${(error as Error).message}`,
      });
      throw error;
    }
  };

  const updateEmployee = async (id: string, employee: Partial<Employee>, password?: string) => {
    try {
      // Ensure role is correctly typed
      const roleValue = employee.role as ExtendedRole | undefined;
      
      // Update profile data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          phone: employee.phone,
          role: roleValue,
        })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      // Update password if provided (this would require admin API in a real app)
      if (password && password.trim() !== '') {
        // In a real application, you'd need to use Supabase admin API or a server function
        toast({
          description: "Password updates require admin API access and are simulated in this demo",
        });
      }
      
      await refetch();
      toast({
        title: "Success",
        description: "Employee updated successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update employee: ${(error as Error).message}`,
      });
      throw error;
    }
  };

  const toggleEmployeeActive = async (id: string, currentRole: ExtendedRole) => {
    try {
      let newRole: ExtendedRole;
      
      // Toggle between active and inactive states
      if (currentRole === 'staff') {
        newRole = 'inactive_staff';
      } else if (currentRole === 'admin') {
        newRole = 'inactive_admin';
      } else if (currentRole === 'inactive_staff') {
        newRole = 'staff';
      } else if (currentRole === 'inactive_admin') {
        newRole = 'admin';
      } else {
        throw new Error(`Cannot toggle role: ${currentRole}`);
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
        description: `Employee ${actionText} successfully`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update employee status: ${(error as Error).message}`,
      });
      throw error;
    }
  };

  return {
    createEmployee,
    updateEmployee,
    toggleEmployeeActive
  };
};
