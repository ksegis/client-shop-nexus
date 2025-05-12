
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define the base role types
export type BaseRole = 'customer' | 'staff' | 'admin';

// Define the extended role type that includes inactive roles
export type ExtendedRole = BaseRole | `inactive_${Exclude<BaseRole, 'customer'>}`;

export type Employee = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: ExtendedRole;
  created_at: string;
  updated_at: string;
};

interface EmployeesContextType {
  employees: Employee[];
  isLoading: boolean;
  error: Error | null;
  createEmployee: (employee: Partial<Employee>, password: string) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Employee>, password?: string) => Promise<void>;
  toggleEmployeeActive: (id: string, currentRole: ExtendedRole) => Promise<void>;
  refetchEmployees: () => Promise<void>;
}

const EmployeesContext = createContext<EmployeesContextType | undefined>(undefined);

export function EmployeesProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  
  const { data: employees = [], isLoading, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      try {
        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('*')
          .in('role', ['staff', 'admin', 'inactive_staff', 'inactive_admin'])
          .order('created_at', { ascending: false });
          
        if (queryError) throw queryError;
        
        return (data || []) as Employee[];
      } catch (error) {
        setError(error as Error);
        return [];
      }
    },
  });

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
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            role: employee.role || 'staff',
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
      // Update profile data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          phone: employee.phone,
          role: employee.role,
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
      
      const actionText = newRole.startsWith('inactive') ? 'deactivated' : 'reactivated';
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

  const refetchEmployees = async () => {
    await refetch();
  };

  return (
    <EmployeesContext.Provider
      value={{
        employees,
        isLoading,
        error,
        createEmployee,
        updateEmployee,
        toggleEmployeeActive,
        refetchEmployees
      }}
    >
      {children}
    </EmployeesContext.Provider>
  );
}

export function useEmployees() {
  const context = useContext(EmployeesContext);
  if (context === undefined) {
    throw new Error('useEmployees must be used within an EmployeesProvider');
  }
  return context;
}
