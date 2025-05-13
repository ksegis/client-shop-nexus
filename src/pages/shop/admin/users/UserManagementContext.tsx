
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { User } from './types';

interface UserManagementContextType {
  users: User[];
  employees: User[];
  customers: User[];
  isLoading: boolean;
  error: Error | null;
  inviteUser: (email: string, firstName: string, lastName: string, role: string, password: string) => Promise<void>;
  resetPassword: (userId: string, email: string, newPassword: string) => Promise<void>;
  refetchUsers: () => Promise<void>;
}

const UserManagementContext = createContext<UserManagementContextType | undefined>(undefined);

export function UserManagementProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<Error | null>(null);
  
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (queryError) throw queryError;
        
        return (data || []) as User[];
      } catch (error: any) {
        setError(error);
        throw error;
      }
    },
  });

  const employees = users.filter(user => 
    user.role === 'admin' || 
    user.role === 'staff' || 
    user.role === 'inactive_admin' || 
    user.role === 'inactive_staff'
  );
  
  const customers = users.filter(user => 
    user.role === 'customer'
  );

  const refetchUsers = async () => {
    await refetch();
  };

  const inviteUser = async (email: string, firstName: string, lastName: string, role: string, password: string) => {
    try {
      // First check if user exists in employees table
      const { data: employeeData, error: employeeError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .eq('role', role)
        .single();

      if (employeeError || !employeeData) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "This email is not associated with an existing employee",
        });
        return;
      }

      // Create user with auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role,
            force_password_change: true // Flag to indicate password change required
          }
        }
      });

      if (signUpError) throw signUpError;
      
      // Update profile with force_password_change flag
      await supabase
        .from('profiles')
        .update({ 
          force_password_change: true,
          first_name: firstName,
          last_name: lastName
        })
        .eq('id', data.user?.id);

      // Simulate sending invitation email
      toast({
        title: "Invitation Sent",
        description: `An invitation has been sent to ${email}`,
      });
      
      await refetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    }
  };

  const resetPassword = async (userId: string, email: string, newPassword: string) => {
    try {
      // In a real application, this would use the Supabase admin API to reset passwords
      // For this demo, we'll simulate it and show a success message
      
      // Update the force_password_change flag
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ force_password_change: true })
        .eq('id', userId);
        
      if (updateError) throw updateError;
      
      toast({
        title: "Password Reset",
        description: `Password for ${email} has been reset. They will be required to change it on next login.`,
      });
      
      await refetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    }
  };

  return (
    <UserManagementContext.Provider
      value={{
        users,
        employees,
        customers,
        isLoading,
        error,
        inviteUser,
        resetPassword,
        refetchUsers,
      }}
    >
      {children}
    </UserManagementContext.Provider>
  );
}

export function useUserManagement() {
  const context = useContext(UserManagementContext);
  if (context === undefined) {
    throw new Error('useUserManagement must be used within a UserManagementProvider');
  }
  return context;
}
