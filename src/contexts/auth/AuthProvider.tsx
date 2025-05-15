
import React, { useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { AuthContextType, UserRole } from './types';
import { useAuthStateListener } from './hooks/useAuthStateListener';
import { useAuthActions } from './hooks/useAuthActions';
import { useProfileManagement } from './hooks/useProfileManagement';

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
  
  const { 
    profile, 
    isLoadingProfile, 
    profileError, 
    updateProfile,
    getPortalType 
  } = useProfileManagement(user);

  const portalType = profile ? getPortalType(profile) : null;
  const isDevMode = process.env.NODE_ENV === 'development';

  // Helper function for validating user access
  const validateAccess = useCallback((allowedRoles: UserRole[]): boolean => {
    if (!profile?.role) {
      return false;
    }

    const userRole = profile.role;
    
    // For admin users, grant access to staff resources too
    if (userRole === 'admin' && allowedRoles.includes('staff')) {
      return true;
    }
    
    return allowedRoles.includes(userRole);
  }, [profile?.role]);

  const contextValue: AuthContextType = {
    user,
    profile,
    isLoading: authLoading || isLoadingProfile,
    isAuthenticated: !!user,
    portalType,
    signIn,
    signOut,
    signUp,
    resetPassword,
    updatePassword,
    updateProfile,
    validateAccess
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
