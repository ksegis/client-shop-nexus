
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUserOperations } from './userOperations';
import { User } from './types';

interface UserManagementContextType {
  users: User[];
  isLoading: boolean;
  error: Error | null;
  createUser: (user: Partial<User>, password: string) => Promise<void>;
  updateUser: (id: string, user: Partial<User>, password?: string) => Promise<void>;
  toggleUserActive: (id: string, currentRole: string) => Promise<void>;
  refetchUsers: () => Promise<void>;
  selectedUserId: string | null;
  setSelectedUserId: (id: string | null) => void;
}

const UserManagementContext = createContext<UserManagementContextType | undefined>(undefined);

export function UserManagementProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<Error | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['users'],
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

  const refetchUsers = async () => {
    await refetch();
  };

  const { createUser, updateUser, toggleUserActive } = useUserOperations(refetchUsers);

  return (
    <UserManagementContext.Provider
      value={{
        users,
        isLoading,
        error,
        createUser,
        updateUser,
        toggleUserActive,
        refetchUsers,
        selectedUserId,
        setSelectedUserId
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
