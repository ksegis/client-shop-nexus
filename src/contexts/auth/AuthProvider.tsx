
import { ReactNode, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from './AuthContext';
import { UserProfile, UserRole, AuthResult } from './types';
import { useAuthStateListener } from './hooks';
import { useRedirection } from './hooks/useRedirection';
import { useProfileManagement } from './hooks/useProfileManagement';
import { useAuthActions } from './hooks/useAuthActions';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const { 
    profile, 
    portalType, 
    isLoadingProfile, 
    fetchProfile, 
    updateProfile, 
    getPortalType 
  } = useProfileManagement();
  const { 
    signUp, 
    signIn, 
    signOut, 
    resetPassword, 
    updatePassword 
  } = useAuthActions();
  
  // Setup auth listener
  useAuthStateListener({
    setUser,
    setSession,
    setIsLoading,
    fetchProfile
  });
  
  // Validate if user has the required role
  const validateAccess = (allowedRoles?: UserRole[]): boolean => {
    if (!user || !profile) return false;
    if (!allowedRoles || allowedRoles.length === 0) return true;
    
    return profile.role ? allowedRoles.includes(profile.role as UserRole) : false;
  };
  
  // Combined loading state
  const combinedIsLoading = isLoading || isLoadingProfile;
  
  // Auth is initialized and user data is available
  const isAuthenticated = !combinedIsLoading && !!user && !!profile;

  // Setup redirects - pass auth state directly instead of using useAuth hook
  useRedirection({
    user,
    isLoading: combinedIsLoading,
    profile,
    portalType,
    validateAccess
  });
  
  // Create auth context value
  const value = {
    user,
    profile,
    portalType,
    session,
    isLoading: combinedIsLoading,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    validateAccess
  };

  useEffect(() => {
    // Log the current auth state when it changes
    console.log('AuthProvider: Auth state changed', {
      isLoading: combinedIsLoading,
      isAuthenticated,
      user: user?.id,
      profile: profile?.id,
      portalType
    });
  }, [combinedIsLoading, isAuthenticated, user, profile, portalType]);
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
