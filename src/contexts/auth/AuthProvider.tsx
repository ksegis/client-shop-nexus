
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
    roleLoaded,
    setLoading,
    updateUserWithRole 
  } = useAuthStateListener();
  
  const { getRedirectPathByRole } = useRedirection();
  const { signUp, signIn, signOut } = useAuthMethods();
  const location = useLocation();
  const [loading, setLoadingState] = useState(true);
  
  // Track redirect attempts with a cooldown mechanism
  const [lastRedirectAttempt, setLastRedirectAttempt] = useState<number>(0);
  const [redirectAttempted, setRedirectAttempted] = useState<boolean>(false);
  const REDIRECT_COOLDOWN_MS = 5000; // 5 second cooldown between redirects
  
  // Sync loading state from the auth listener
  useEffect(() => {
    setLoadingState(authStateLoading);
  }, [authStateLoading]);

  // Handle hash fragments on initial load
  useEffect(() => {
    // Handle empty hash fragment - redirect to auth page
    if (location.hash === '#' && location.pathname === '/') {
      // Don't redirect to role-based page yet, just clean up the URL
      window.history.replaceState(null, '', '/auth');
    }
  }, [location]);

  // Setup profile-based redirections
  useEffect(() => {
    // No need to continue if we're still loading or no user
    if (loading || !user) {
      return;
    }
    
    // If we have role information, we're good to go
    if (roleLoaded && user?.app_metadata?.role) {
      console.log("Role loaded successfully:", user.app_metadata.role);
      setRedirectAttempted(false); // Reset this so we can redirect if needed later
      return;
    }
    
    // Skip redirects during cooldown period
    const now = Date.now();
    if (now - lastRedirectAttempt < REDIRECT_COOLDOWN_MS) {
      return;
    }
    
    // Only fetch profile if we don't already have role information
    if (!redirectAttempted && !user.app_metadata?.role) {
      console.log("Attempting to fetch profile for role determination");
      setLastRedirectAttempt(now);
      setRedirectAttempted(true);
      
      // Fetch user profile to get role information
      const checkUserRole = async () => {
        try {
          const profile = await fetchUserProfile(user.id);
          if (profile && profile.role) {
            console.log("Found role in profile:", profile.role);
            // Update the user with the role from the profile
            await updateUserWithRole(user.id, profile.role);
          } else {
            console.log("No role found in profile, user may need to complete registration");
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      };
      
      checkUserRole();
    }
  }, [user, loading, roleLoaded, location.pathname, lastRedirectAttempt, redirectAttempted, updateUserWithRole]);

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    loading,
    getRedirectPathByRole,
    updateUserWithRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
