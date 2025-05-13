
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
  // Add a state to prevent redirect loops
  const [redirectAttempted, setRedirectAttempted] = useState(false);

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
    if (user?.id && !loading && !redirectAttempted) {
      // Fetch user profile to get role information
      const checkUserRole = async () => {
        try {
          console.log("Fetching profile for role check with user ID:", user.id);
          const profile = await fetchUserProfile(user.id);
          
          if (profile?.role) {
            console.log("Profile fetch successful, got role:", profile.role);
            // Check if user is on the correct portal for their role
            // Mark that we've attempted a redirect to prevent loops
            setRedirectAttempted(true);
            redirectUserBasedOnRole(profile.role, location.pathname);
          } else {
            console.log("Profile found but no role");
            setRedirectAttempted(true);
          }
        } catch (error) {
          console.error("Failed to fetch profile for role check:", error);
          setRedirectAttempted(true);
        }
      };
      
      checkUserRole();
    } else if (!user && !loading) {
      // If we have no user and we're not loading, reset the redirect attempt flag
      setRedirectAttempted(false);
    }
  }, [user?.id, loading, location.pathname, redirectUserBasedOnRole, redirectAttempted]);

  // Reset redirect attempt when location changes
  useEffect(() => {
    if (redirectAttempted) {
      // Only reset after a delay to prevent immediate loop
      const timeout = setTimeout(() => {
        setRedirectAttempted(false);
      }, 2000); // 2 second cooldown between redirect attempts
      
      return () => clearTimeout(timeout);
    }
  }, [location.pathname, redirectAttempted]);

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
