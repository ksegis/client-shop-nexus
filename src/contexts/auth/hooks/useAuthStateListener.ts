
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

export function useAuthStateListener() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasLogged, setHasLogged] = useState<boolean>(false);
  
  // Listen for authentication state changes
  useEffect(() => {
    // Only log once
    if (!hasLogged) {
      console.log('Setting up auth state listener...');
      setHasLogged(true);
    }
    
    // First set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!hasLogged) {
          console.log('Auth state change:', event);
        }
        
        // Only synchronously update state in the callback
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
        
        // Use setTimeout to defer any complex operations
        if (currentSession?.user) {
          setTimeout(async () => {
            try {
              // Check if user has a profile
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', currentSession.user.id)
                .maybeSingle();
                
              if (profileError) {
                console.error('Error fetching user profile:', profileError);
              } else if (!profileData) {
                console.warn('No profile found for user, this may cause RLS issues');
              } else if (!hasLogged) {
                console.log('User profile verified, role:', profileData.role);
              }
            } catch (err) {
              console.error('Error in deferred profile check:', err);
            }
          }, 0);
        }
      }
    );
    
    // Then check for existing session (always after setting up the listener)
    const initSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!hasLogged && data.session?.user?.email) {
          console.log('Got existing session:', data.session?.user?.email);
        }
        
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initSession();
    
    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [hasLogged]);
  
  return { user, session, loading };
}
