
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
  const { toast } = useToast();
  const navigate = useNavigate();

  // Exposed function to update user with role
  const updateUserWithRole = useCallback((userId: string, profileRole: string) => {
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
  }, []);

  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // Set up auth state listener FIRST (important to prevent deadlocks)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession?.user?.email);
        
        // Handle synchronous state updates immediately
        setUser(currentSession?.user ?? null);
        setSession(currentSession);
        
        if (event === 'SIGNED_OUT') {
          console.log("User signed out, redirecting to login");
          navigate('/auth', { replace: true });
        }
        
        if (event === 'PASSWORD_RECOVERY') {
          console.log("Password recovery event detected");
          navigate('/customer/login?reset=true', { replace: true });
        }
        
        if (event === 'USER_UPDATED') {
          console.log("User updated event detected");
          toast({
            title: "Account updated",
            description: "Your account has been updated successfully."
          });
        }
        
        // If user just signed in, fetch profile data in a non-blocking way
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && currentSession?.user) {
          // Use setTimeout to avoid deadlock with Supabase client
          setTimeout(async () => {
            try {
              const profile = await fetchUserProfile(currentSession.user.id);
              if (profile?.role) {
                console.log("Setting user role from profile:", profile.role);
                updateUserWithRole(currentSession.user.id, profile.role);
              }
            } catch (error) {
              console.error("Failed to fetch profile after auth event:", error);
            }
          }, 0);
        }
        
        // Mark loading as false after any auth change
        setLoading(false);
      }
    );
    
    // THEN check for existing session (with a slight delay to avoid race conditions)
    setTimeout(async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        console.log("Initial session check:", initialSession?.user?.email);
        
        if (initialSession?.user) {
          setUser(initialSession.user);
          setSession(initialSession);
          
          // Fetch profile data in a separate non-blocking operation
          if (initialSession.user.id) {
            try {
              const profile = await fetchUserProfile(initialSession.user.id);
              if (profile?.role) {
                console.log("Initial session: got user role from profile:", profile.role);
                updateUserWithRole(initialSession.user.id, profile.role);
              }
            } catch (profileError) {
              console.error("Failed to fetch initial profile:", profileError);
            }
          }
        }
      } catch (sessionError) {
        console.error("Failed to get session:", sessionError);
      } finally {
        // Make sure loading is set to false after initial session check
        setLoading(false);
      }
    }, 100);

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast, updateUserWithRole]);

  return { user, session, loading, setUser, setSession, setLoading };
}
