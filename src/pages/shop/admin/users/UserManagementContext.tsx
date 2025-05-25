
import React, { createContext, useContext, ReactNode } from 'react';
import { User } from './types';
import { 
  useUserQuery,
  useUserInvitation,
  usePasswordReset,
  useProfileManagement,
  useUserActivation
} from './hooks';
import { useUserImpersonation } from './hooks/useUserImpersonation';

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
  deleteUser: (userId: string, email: string) => Promise<boolean>;
  refetchUsers: () => Promise<void>;
  impersonateUser: (userId: string, email: string) => Promise<boolean>;
  exitImpersonationMode: () => Promise<boolean>;
  impersonationLoading: string | null;
  isImpersonationActive: () => boolean;
  getImpersonatedUser: () => string | null;
}

const UserManagementContext = createContext<UserManagementContextType | undefined>(undefined);

export function UserManagementProvider({ children }: { children: ReactNode }) {
  console.log('UserManagementProvider: Initializing provider');
  
  const queryResult = useUserQuery();
  console.log('UserManagementProvider: Query result:', queryResult);
  
  const { users, employees, customers, isLoading, error, refetchUsers } = queryResult;
  const { inviteUser } = useUserInvitation(refetchUsers);
  const { resetPassword } = usePasswordReset(refetchUsers);
  const { updateUserProfile } = useProfileManagement(refetchUsers);
  const { toggleUserActive, deleteUser } = useUserActivation(refetchUsers);
  const { 
    impersonateUser, 
    exitImpersonationMode, 
    impersonationLoading,
    isImpersonationActive,
    getImpersonatedUser
  } = useUserImpersonation();

  console.log('UserManagementProvider: Provider state:', {
    userCount: users?.length || 0,
    employeeCount: employees?.length || 0,
    customerCount: customers?.length || 0,
    isLoading,
    hasError: !!error,
    actualUsers: users,
    errorDetails: error?.message,
    usersType: typeof users,
    usersIsArray: Array.isArray(users)
  });

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
        deleteUser,
        refetchUsers,
        impersonateUser,
        exitImpersonationMode,
        impersonationLoading,
        isImpersonationActive,
        getImpersonatedUser
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
  
  console.log('useUserManagement: Context accessed:', {
    hasUsers: !!context.users,
    userCount: context.users?.length || 0,
    isLoading: context.isLoading
  });
  
  return context;
}
