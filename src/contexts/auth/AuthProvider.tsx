
import React, { useCallback, useEffect, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { AuthContextType, UserRole } from './types';
import { useAuthStateListener } from './hooks/useAuthStateListener';
import { useAuthActions } from './hooks/useAuthActions';
import { useProfileManagement } from './hooks/useProfileManagement';
import { useLocation } from 'react-router-dom';

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
    profileLoading, 
    portalType 
  } = useProfileManagement(user);
  
  const location = useLocation();
  
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
    session,
    isLoading: authLoading || profileLoading,
    isAuthenticated: !!user,
    portalType,
    signIn,
    signOut,
    signUp,
    resetPassword,
    updatePassword,
    getRedirectPathByRole,
    validateAccess,
    isDevMode
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
