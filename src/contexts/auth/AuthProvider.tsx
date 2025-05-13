
import React, { useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { fetchUserProfile } from './authUtils';
import { useAuthStateListener, useRedirection, useAuthMethods } from './hooks';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { 
    user, 
    session, 
    loading: authStateLoading, 
    setLoading 
  } = useAuthStateListener();
  
  const { redirectUserBasedOnRole, getRedirectPathByRole } = useRedirection();
  const { signUp, signIn, signOut } = useAuthMethods();
  const location = useLocation();
  const [loading, setLoadingState] = useState(true);

  // Sync loading state from the auth listener
  useEffect(() => {
    setLoadingState(authStateLoading);
  }, [authStateLoading]);

  // Handle hash fragments on initial load
  useEffect(() => {
    // Handle empty hash fragment - redirect to auth page
    if (location.hash === '#' && location.pathname === '/') {
      redirectUserBasedOnRole(user?.app_metadata?.role || '', '/');
    }
  }, [location, redirectUserBasedOnRole, user?.app_metadata?.role]);

  // Setup profile-based redirections
  useEffect(() => {
    if (user?.id && !loading) {
      // Fetch user profile to get role information
      const checkUserRole = async () => {
        try {
          const profile = await fetchUserProfile(user.id);
          if (profile?.role) {
            // Check if user is on the correct portal for their role
            setTimeout(() => {
              redirectUserBasedOnRole(profile.role, location.pathname);
            }, 0);
          }
        } catch (error) {
          console.error("Failed to fetch profile for role check:", error);
        }
      };
      
      checkUserRole();
    }
  }, [user?.id, loading, location.pathname, redirectUserBasedOnRole]);

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    loading,
    getRedirectPathByRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
