
import React, { useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { fetchUserProfile } from './authUtils';
import { useAuthStateListener, useRedirection, useAuthMethods } from './hooks';
import { supabase, checkSupabaseConnection } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export function AuthProvider({ children }: { children: ReactNode }) {
  // ALL useState hooks must be declared first, in the same order every render
  const [loading, setLoadingState] = useState(true);
  const [lastRedirectAttempt, setLastRedirectAttempt] = useState<number>(0);
  const [redirectAttempted, setRedirectAttempted] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<boolean>(false);
  
  // THEN all hook calls from other hooks
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
  
  // Constants (not hooks) can be defined anywhere
  const REDIRECT_COOLDOWN_MS = 8000; // 8 second cooldown between redirects

  // Check connection status on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await checkSupabaseConnection();
        if (!isConnected) {
          setConnectionError(true);
          toast({
            variant: "destructive",
            title: "Connection Error",
            description: "Could not connect to the server. Please check your internet connection.",
          });
        }
      } catch (error) {
        console.error("Connection check failed:", error);
        setConnectionError(true);
      }
    };
    
    // Only check connection if we're not on the auth page to avoid unnecessary checks
    if (location.pathname !== '/auth') {
      checkConnection();
    }
  }, [location.pathname]);
  
  // useEffect hooks must come after all other hooks
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
          // Add a small delay to avoid potential race conditions
          await new Promise(resolve => setTimeout(resolve, 300));
          
          if (!user.id) {
            console.error("No user ID available for profile check");
            return;
          }
          
          const profile = await fetchUserProfile(user.id);
          if (profile && profile.role) {
            console.log("Found role in profile:", profile.role);
            // Update the user with the role from the profile
            if (updateUserWithRole) {
              await updateUserWithRole(user.id, profile.role);
            }
          } else {
            console.log("No role found in profile, user may need to complete registration");
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          // Don't set redirectAttempted to false here - we'll try again after cooldown
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

  // Show connection error if we couldn't connect to Supabase
  if (connectionError && !loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-medium text-gray-900">Connection Error</h3>
            <p className="text-gray-500 mt-2">
              Unable to connect to the server. Please check your internet connection and try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
