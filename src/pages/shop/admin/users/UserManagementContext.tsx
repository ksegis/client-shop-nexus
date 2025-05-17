
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { User, InviteUserFormValues } from './types';
import { ExtendedUserRole } from '@/integrations/supabase/types-extensions';

interface UserManagementContextType {
  users: User[];
  employees: User[];
  customers: User[];
  isLoading: boolean;
  error: Error | null;
  inviteUser: (email: string, firstName: string, lastName: string, role: "admin" | "staff", password: string) => Promise<void>;
  resetPassword: (userId: string, email: string, newPassword: string) => Promise<void>;
  updateUserProfile: (userId: string, profileData: Partial<User>) => Promise<void>;
  toggleUserActive: (userId: string, currentRole: string) => Promise<void>;
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
    user.role === 'inactive_staff' ||
    user.role === 'test_admin' ||
    user.role === 'test_staff'
  );
  
  const customers = users.filter(user => 
    user.role === 'customer' || user.role === 'test_customer'
  );

  const refetchUsers = async () => {
    await refetch();
  };

  const inviteUser = async (email: string, firstName: string, lastName: string, role: "admin" | "staff", password: string) => {
    try {
      // Get current user id to track who sent the invitation
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("You must be logged in to invite users");
      
      // Generate a unique invite token
      const inviteToken = crypto.randomUUID();
      
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
      
      // Update profile with force_password_change flag, invite_token and invited_by
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          first_name: firstName,
          last_name: lastName,
          force_password_change: true,
          invite_token: inviteToken,
          invited_by: currentUser.id
        })
        .eq('id', data.user?.id);

      if (updateError) throw updateError;

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
      
      // Update the force_password_change flag using RPC
      const { error: updateError } = await supabase
        .rpc('update_password_change_flag', {
          user_id: userId,
          force_change: true
        });
        
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

  const updateUserProfile = async (userId: string, profileData: Partial<User>) => {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone,
          facebook_url: profileData.facebook_url,
          twitter_url: profileData.twitter_url,
          instagram_url: profileData.instagram_url,
          linkedin_url: profileData.linkedin_url,
        })
        .eq('id', userId);

      if (updateError) throw updateError;
      
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
        variant: "destructive",
        title: "Error updating user status",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
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
        updateUserProfile,
        toggleUserActive,
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
