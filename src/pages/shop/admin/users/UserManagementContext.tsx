
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
  // Use our custom hooks
  const { users, employees, customers, isLoading, error, refetchUsers } = useUserQuery();
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
  return context;
}
