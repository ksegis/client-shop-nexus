
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
  
  // Track redirect attempts with a cooldown mechanism
  const [lastRedirectAttempt, setLastRedirectAttempt] = useState<number>(0);
  const REDIRECT_COOLDOWN_MS = 3000; // 3 second cooldown between redirects
  
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
    if (!user?.id || loading) return;
    
    // Check if we should attempt another redirect
    const now = Date.now();
    if (now - lastRedirectAttempt < REDIRECT_COOLDOWN_MS) {
      // Still in cooldown period, don't attempt another redirect
      return;
    }
    
    // Fetch user profile to get role information
    const checkUserRole = async () => {
      try {
        console.log("Fetching profile for role check with user ID:", user.id);
        const profile = await fetchUserProfile(user.id);
        
        if (profile?.role) {
          console.log("Profile fetch successful, got role:", profile.role);
          // Update timestamp to prevent redirect loops
          setLastRedirectAttempt(Date.now());
          redirectUserBasedOnRole(profile.role, location.pathname);
        } else {
          console.log("Profile found but no role");
        }
      } catch (error) {
        console.error("Failed to fetch profile for role check:", error);
      }
    };
    
    checkUserRole();
  }, [user?.id, loading, location.pathname, redirectUserBasedOnRole, lastRedirectAttempt]);

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
