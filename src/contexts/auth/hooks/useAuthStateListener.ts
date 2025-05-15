
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export function useAuthStateListener() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasLogged, setHasLogged] = useState<boolean>(false);
  const authStateInitialized = useRef<boolean>(false);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  
  // Listen for authentication state changes
  useEffect(() => {
    // Track if component is mounted to prevent state updates after unmount
    let isMounted = true;
    
    // Only log once
    if (!hasLogged) {
      console.log('Setting up auth state listener...');
      setHasLogged(true);
    }
    
    // CRITICAL: Check if we already have a subscription to avoid duplicates
    if (subscriptionRef.current) {
      console.log('Auth listener already set up, skipping duplicate initialization');
      return;
    }
    
    const initializeAuth = async () => {
      try {
        // First get the existing session - this prevents flashing auth states
        const { data } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (data.session) {
          if (!hasLogged && data.session?.user?.email) {
            console.log('Got existing session:', data.session?.user?.email);
          }
          setSession(data.session);
          setUser(data.session.user);
          authStateInitialized.current = true;
        } else {
          console.log('No authenticated user found');
          setUser(null);
          setSession(null);
          authStateInitialized.current = true;
        }
        
        // After we've established the initial state, THEN set up the listener
        if (!subscriptionRef.current) {
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
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
          );
          
          // Store the subscription reference
          subscriptionRef.current = subscription;
        }
        
        // Ensure we set loading to false even if auth changes don't fire
        setTimeout(() => {
          if (isMounted && loading) {
            setLoading(false);
          }
        }, 1000);
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    initializeAuth();
    
    // Cleanup subscription on unmount - properly store the reference
    return () => {
      isMounted = false;
      // Don't unsubscribe here - that would cause reauth issues
      // We'll manage the subscription lifecycle at the application level
    };
  }, [hasLogged, loading]);
  
  return { user, session, loading };
}
