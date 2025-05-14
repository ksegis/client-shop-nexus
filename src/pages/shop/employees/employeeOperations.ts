import { supabase } from '@/integrations/supabase/client';
import { Employee, ExtendedRole } from './types';
import { useToast } from '@/hooks/use-toast';
import { ExtendedUserRole, mapExtendedRoleToDbRole } from '@/integrations/supabase/types-extensions';

export const useEmployeeOperations = (refetch: () => Promise<void>) => {
  const { toast } = useToast();

  const createEmployee = async (employee: Partial<Employee>, password: string) => {
    try {
      // Map the ExtendedRole to a DatabaseUserRole
      const dbRole = mapExtendedRoleToDbRole(employee.role as ExtendedUserRole);
      
      // Sign up the employee with email and password
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: employee.email || '',
        password: password,
        options: {
          data: {
            first_name: employee.first_name || '',
            last_name: employee.last_name || '',
            phone: employee.phone || '',
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
        description: `Failed to create employee: ${error.message}`,
      });
      throw error;
    }
  };

  const updateEmployee = async (id: string, employee: Partial<Employee>, password?: string) => {
    try {
      // Map the ExtendedRole to a DatabaseUserRole
      const dbRole = mapExtendedRoleToDbRole(employee.role as ExtendedUserRole);
      
      // Update profile data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          phone: employee.phone,
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
        description: "Employee updated successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update employee: ${error.message}`,
      });
      throw error;
    }
  };

  const toggleEmployeeActive = async (id: string, currentRole: ExtendedRole) => {
    try {
      // Map the ExtendedRole to a DatabaseUserRole based on active/inactive state
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
        default:
          newRole = 'staff';
      }
      
      const dbRole = mapExtendedRoleToDbRole(newRole);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: dbRole })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      await refetch();
      
      const actionText = currentRole.startsWith('inactive_') ? 'reactivated' : 'deactivated';
      toast({
        title: "Success",
        description: `Employee ${actionText} successfully`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update employee status: ${error.message}`,
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
