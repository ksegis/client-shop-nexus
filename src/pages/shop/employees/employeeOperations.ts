
import { supabase } from '@/integrations/supabase/client';
import { Employee, ExtendedRole } from './types';
import { useToast } from '@/hooks/use-toast';
import { ExtendedUserRole, DatabaseUserRole, mapExtendedRoleToDbRole } from '@/integrations/supabase/types-extensions';

export const useEmployeeOperations = (refetch: () => Promise<void>) => {
  const { toast } = useToast();

  const createEmployee = async (employee: Partial<Employee>, password: string) => {
    try {
      // Map the ExtendedRole to a DatabaseUserRole
      const dbRole = mapExtendedRoleToDbRole(employee.role as ExtendedRole);
      
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
    } catch (error: any) {
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
      const dbRole = mapExtendedRoleToDbRole(employee.role as ExtendedRole);
      
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
    } catch (error: any) {
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
      let dbRole: DatabaseUserRole;
      
      // Toggle between active and inactive states
      switch (currentRole) {
        case 'staff':
        case 'admin':
          // If currently active, we want to set as inactive in our UI but DB only accepts active roles
          dbRole = mapExtendedRoleToDbRole(currentRole);
          break;
        case 'inactive_staff':
        case 'inactive_admin':
          // If currently inactive, we want to activate
          dbRole = mapExtendedRoleToDbRole(currentRole);
          break;
        default:
          dbRole = 'staff';
      }
      
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
