
import React, { useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { AuthContextType, UserRole } from './types';
import { useAuthStateListener } from './hooks/useAuthStateListener';
import { useAuthActions } from './hooks/useAuthActions';
import { useAuthLogging } from './hooks/useAuthLogging';
import { useProfileManagement } from './hooks/useProfileManagement';
import { useTestUsers } from './hooks/useTestUsers';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user, session, loading: authLoading } = useAuthStateListener();
  const { 
    signUp, 
    signIn, 
    signOut, 
    resetPassword, 
    updatePassword,
    getRedirectPathByRole
  } = useAuthActions();
  const { logAuthEvent } = useAuthLogging();
  
  const { 
    profile, 
    profileLoading, 
    isTestUser, 
    portalType 
  } = useProfileManagement(user);
  
  const { testUsers, impersonateTestUser, stopImpersonation } = useTestUsers();
  
  const location = useLocation();
  const { toast } = useToast();
  
  const isDevMode = process.env.NODE_ENV === 'development';
  
  // Helper functions for validating user access
  const validateAccess = useCallback((allowedRoles: UserRole[]): boolean => {
    if (!profile?.role) {
      console.warn('validateAccess: User has no role.');
      return false;
    }

    const userRole = profile.role;
    
    // For admin users, grant access to staff resources too
    if ((userRole === 'admin' || userRole === 'test_admin') && 
        (allowedRoles.includes('staff') || allowedRoles.includes('test_staff'))) {
      return true;
    }
    
    const hasAccess = allowedRoles.includes(userRole);
    
    if (!hasAccess) {
      console.warn(`validateAccess: User role ${userRole} does not have access. Allowed roles: ${allowedRoles.join(', ')}`);
    }
    
    return hasAccess;
  }, [profile?.role]);

  const contextValue: AuthContextType = {
    user,
    profile,
    session,
    isLoading: authLoading || profileLoading,
    isAuthenticated: !!user,
    isTestUser,
    portalType,
    signIn,
    signOut,
    signUp,
    resetPassword,
    updatePassword,
    getRedirectPathByRole,
    impersonateTestUser,
    stopImpersonation,
    validateAccess,
    isDevMode
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
