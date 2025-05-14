
import React, { ReactNode, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { AuthContextType } from './types';
import { useAuthStateListener } from './hooks/useAuthStateListener';
import { useProfileManagement } from './hooks/useProfileManagement';
import { useDevMode } from './hooks/useDevMode';
import { useAuthActions } from './hooks/useAuthActions';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: authUser, session, loading: authLoading } = useAuthStateListener();
  const { profile, setProfile } = useProfileManagement(authUser);
  const { 
    isDevMode, devUser, mockProfile, useDevCustomer, showDevModeNotification 
  } = useDevMode();
  
  const [loading, setLoading] = useState<boolean>(true);
  
  const {
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    getRedirectPathByRole,
    impersonateCustomer
  } = useAuthActions();

  // Set up automatic authentication for development
  useEffect(() => {
    const initializeAuth = async () => {
      if (!authUser) {
        // If no authenticated user, use dev mode
        showDevModeNotification();
      }
      setLoading(false);
    };
    
    if (!authLoading) {
      initializeAuth();
    }
  }, [authLoading, authUser]);

  // Context value that matches AuthContextType
  const value: AuthContextType = {
    user: authUser || devUser,
    profile: profile || (authUser ? null : mockProfile),
    session,
    isLoading: loading || authLoading,
    isAuthenticated: !!authUser || !!devUser,
    isDevMode,
    signUp,
    signIn,
    signOut: () => signOut(useDevCustomer),
    resetPassword,
    updatePassword,
    getRedirectPathByRole,
    impersonateCustomer
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
