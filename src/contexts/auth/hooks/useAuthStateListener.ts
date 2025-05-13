
import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { fetchUserProfile } from '../authUtils';

export function useAuthStateListener() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoaded, setRoleLoaded] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Rate limiting protection
  const [lastRefreshAttempt, setLastRefreshAttempt] = useState(0);
  const [refreshFailCount, setRefreshFailCount] = useState(0);
  const REFRESH_COOLDOWN_MS = 3000; // 3 seconds between refresh attempts
  const MAX_REFRESH_ATTEMPTS = 3; // Maximum refresh attempts before backing off

  // Exposed function to update user with role
  const updateUserWithRole = useCallback(async (userId: string, profileRole: string) => {
    console.log("Updating user with role:", profileRole);
    
    // First update the local state for immediate UI feedback
    setUser(currentUser => {
      if (!currentUser) return null;
      
      return {
        ...currentUser,
        app_metadata: {
          ...currentUser.app_metadata,
          role: profileRole
        }
      };
    });
    
    // Indicate that we've loaded the role
    setRoleLoaded(true);
    
    // Check if we need to respect rate limiting or if we've had too many failures
    const now = Date.now();
    if (now - lastRefreshAttempt < REFRESH_COOLDOWN_MS || refreshFailCount >= MAX_REFRESH_ATTEMPTS) {
      console.log("Skipping session refresh due to rate limiting cooldown or too many failures");
      return;
    }
    
    setLastRefreshAttempt(now);
    
    try {
      // Now refresh the session to ensure the role is picked up by Supabase Auth
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        // Handle rate limiting separately
        if (error.status === 429) {
          console.log("Rate limit reached when refreshing session, will try later");
          setRefreshFailCount(prev => prev + 1);
          
          // If we've hit rate limits too many times, show a toast
          if (refreshFailCount >= MAX_REFRESH_ATTEMPTS - 1) {
            toast({
              title: "Login Processing",
              description: "Please wait while we finish setting up your session...",
            });
          }
        } else {
          console.error("Failed to refresh session after role update:", error);
          setRefreshFailCount(prev => prev + 1);
        }
      } else if (data?.user) {
        console.log("Session refreshed after role update");
        setRefreshFailCount(0); // Reset fail count on success
      }
    } catch (refreshError: any) {
      // Handle "Auth session missing" errors gracefully
      if (refreshError.message && refreshError.message.includes('Auth session missing')) {
        console.log("No active session to refresh");
      } else {
        console.error("Error refreshing session:", refreshError);
      }
      setRefreshFailCount(prev => prev + 1);
    }
  }, [lastRefreshAttempt, refreshFailCount, toast]);

  useEffect(() => {
    console.log("Setting up auth state listener");
    let isMounted = true;
    let initialProfileCheck = false;
    let profileCheckTimeout: NodeJS.Timeout | null = null;
    
    // Set up auth state listener FIRST (important to prevent deadlocks)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession?.user?.email);
        
        if (!isMounted) return;
        
        // Handle synchronous state updates immediately
        if (currentSession?.user) {
          const existingRole = currentSession.user.app_metadata?.role;
          // Only update user if we don't have role info yet or if it changed
          setUser(prev => {
            if (prev?.app_metadata?.role === existingRole && existingRole) {
              return prev;
            }
            return currentSession.user;
          });
          
          // Mark role as loaded if we have it
          if (existingRole) {
            setRoleLoaded(true);
          }
        } else {
          setUser(null);
          setRoleLoaded(false);
          // Reset rate limiting counters on logout
          setRefreshFailCount(0);
        }
        
        setSession(currentSession);
        
        if (event === 'SIGNED_OUT') {
          console.log("User signed out, redirecting to login");
          setRoleLoaded(false);
          navigate('/auth', { replace: true });
        }
        
        // If user just signed in, fetch profile data in a non-blocking way
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && currentSession?.user) {
          // Clear any existing timeout to prevent race conditions
          if (profileCheckTimeout) {
            clearTimeout(profileCheckTimeout);
          }
          
          // Use setTimeout to avoid deadlock with Supabase client
          profileCheckTimeout = setTimeout(async () => {
            if (!isMounted) return;
            
            try {
              // Skip profile check if we already have role info
              if (currentSession.user.app_metadata?.role) {
                console.log("User already has role metadata:", currentSession.user.app_metadata.role);
                setRoleLoaded(true);
                setLoading(false);
                return;
              }
              
              const profile = await fetchUserProfile(currentSession.user.id);
              if (profile?.role && isMounted) {
                console.log("Setting user role from profile:", profile.role);
                try {
                  await updateUserWithRole(currentSession.user.id, profile.role);
                } catch (error) {
                  console.error("Failed to update user with role:", error);
                }
              }
            } catch (error) {
              console.error("Failed to fetch profile after auth event:", error);
            } finally {
              // Mark loading as false after any auth change
              if (isMounted) setLoading(false);
            }
          }, 800); // Slightly longer delay to ensure auth state is settled
        } else {
          // Mark loading as false after any auth change
          if (isMounted) setLoading(false);
        }
      }
    );
    
    // THEN check for existing session (with a slight delay to avoid race conditions)
    setTimeout(async () => {
      if (!isMounted) return;
      
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        console.log("Initial session check:", initialSession?.user?.email);
        
        if (initialSession?.user && isMounted) {
          const existingRole = initialSession.user.app_metadata?.role;
          
          setUser(initialSession.user);
          setSession(initialSession);
          
          // If we already have role metadata, we're good to go
          if (existingRole) {
            console.log("Initial session: user already has role:", existingRole);
            setRoleLoaded(true);
            setLoading(false);
            return;
          }
          
          // Fetch profile data in a separate non-blocking operation
          if (initialSession.user.id && !initialProfileCheck) {
            initialProfileCheck = true;
            try {
              const profile = await fetchUserProfile(initialSession.user.id);
              if (profile?.role && isMounted) {
                console.log("Initial session: got user role from profile:", profile.role);
                try {
                  await updateUserWithRole(initialSession.user.id, profile.role);
                } catch (error) {
                  console.error("Failed to update user with role:", error);
                }
              }
            } catch (profileError) {
              console.error("Failed to fetch initial profile:", profileError);
            } finally {
              if (isMounted) setLoading(false);
            }
          }
        } else {
          if (isMounted) setLoading(false);
        }
      } catch (sessionError) {
        console.error("Failed to get session:", sessionError);
        if (isMounted) setLoading(false);
      }
    }, 500);

    return () => {
      isMounted = false;
      if (profileCheckTimeout) {
        clearTimeout(profileCheckTimeout);
      }
      subscription.unsubscribe();
    };
  }, [navigate, toast, updateUserWithRole]);

  return { 
    user, 
    session, 
    loading, 
    roleLoaded,
    setUser, 
    setSession, 
    setLoading, 
    updateUserWithRole 
  };
}
