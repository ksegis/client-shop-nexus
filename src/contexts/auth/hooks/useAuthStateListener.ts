
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export function useAuthStateListener() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasLogged, setHasLogged] = useState<boolean>(false);
  
  // Listen for authentication state changes
  useEffect(() => {
    // Track if component is mounted to prevent state updates after unmount
    let isMounted = true;
    
    // Only log once
    if (!hasLogged) {
      console.log('Setting up auth state listener...');
      setHasLogged(true);
    }
    
    // Set up the auth state change listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;
        
        if (!hasLogged) {
          console.log('Auth state change:', event);
        }
        
        // Only synchronously update state in the callback
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          console.log('User signed out, clearing session');
        } else if (currentSession) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          console.log('Auth state updated, user:', currentSession?.user?.email);
        }
        
        // Don't set loading to false until we know if there's a valid session
        if (event !== 'INITIAL_SESSION' || !currentSession) {
          setLoading(false);
        }
      }
    );
    
    // THEN get the existing session (critical for initial page loads)
    const initSession = async () => {
      if (!isMounted) return;
      
      try {
        const { data } = await supabase.auth.getSession();
        if (!hasLogged && data.session?.user?.email) {
          console.log('Got existing session:', data.session?.user?.email);
        }
        
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
        } else {
          // No session, make sure user is set to null
          console.log('No authenticated user found');
          setUser(null);
          setSession(null);
        }
        
        // Make sure to set loading to false even if there's no session
        if (isMounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    // Initialize session
    initSession();
    
    // Cleanup subscription on unmount
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [hasLogged]);
  
  return { user, session, loading };
}
