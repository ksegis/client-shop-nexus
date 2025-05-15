
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
    let subscription: { unsubscribe: () => void } | null = null;
    
    // Only log once
    if (!hasLogged) {
      console.log('Setting up auth state listener...');
      setHasLogged(true);
    }
    
    // CRITICAL: First get the existing session - this prevents flashing auth states
    const initSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        
        if (data.session) {
          if (!hasLogged && data.session?.user?.email) {
            console.log('Got existing session:', data.session?.user?.email);
          }
          setSession(data.session);
          setUser(data.session.user);
        } else {
          console.log('No authenticated user found');
          setUser(null);
          setSession(null);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      }
    };

    // Initialize session first
    initSession().then(() => {
      if (!isMounted) return;
      
      // THEN set up the auth state change listener
      subscription = supabase.auth.onAuthStateChange(
        (event, currentSession) => {
          if (!isMounted) return;
          
          if (!hasLogged) {
            console.log('Auth state change:', event);
          }
          
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
      ).data.subscription;
      
      // Ensure we set loading to false even if auth changes don't fire
      setTimeout(() => {
        if (isMounted && loading) {
          setLoading(false);
        }
      }, 1000);
    });
    
    // Cleanup subscription on unmount - properly store the reference
    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [hasLogged, loading]);
  
  return { user, session, loading };
}
