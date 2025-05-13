
import React, { useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { fetchUserProfile } from './authUtils';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle hash fragments on initial load
  useEffect(() => {
    // Handle empty hash fragment - redirect to auth page
    if (location.hash === '#' && location.pathname === '/') {
      navigate('/auth', { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // Set up auth state listener FIRST (important to prevent deadlocks)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
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
        
        // Mark loading as false after any auth change
        setLoading(false);
      }
    );
    
    // THEN check for existing session (with a slight delay to avoid race conditions)
    setTimeout(() => {
      supabase.auth.getSession()
        .then(({ data: { session: initialSession } }) => {
          console.log("Initial session check:", initialSession?.user?.email);
          
          if (initialSession?.user) {
            setUser(initialSession.user);
            setSession(initialSession);
            
            // Fetch profile data in a separate non-blocking operation
            if (initialSession.user.id) {
              fetchUserProfile(initialSession.user.id).then(profile => {
                if (profile?.role) {
                  setUser(currentUser => {
                    if (!currentUser) return null;
                    return {
                      ...currentUser,
                      app_metadata: {
                        ...currentUser.app_metadata,
                        role: profile.role
                      }
                    };
                  });
                }
              });
            }
          }
          
          // Make sure loading is set to false after initial session check
          setLoading(false);
        })
        .catch(error => {
          console.error("Failed to get session:", error);
          setLoading(false);
        });
    }, 100);

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      setLoading(true);
      console.log("Attempting signup for:", email);
      
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        }
      });

      if (error) throw error;
      
      toast({
        title: "Account created",
        description: "Please check your email to confirm your account.",
      });
      
      return Promise.resolve();
    } catch (error: any) {
      console.error("Signup error:", error.message);
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive",
      });
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      console.log("AuthContext: Signing in with email:", email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        throw error;
      }
      
      console.log("AuthContext: Sign in successful:", data.user?.email);
      
      // Configure session persistence after successful sign-in
      if (!rememberMe && data.session) {
        try {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        } catch (sessionError) {
          console.error("Error setting session persistence:", sessionError);
        }
      }
      
      // We don't navigate here - let the component handle navigation
      return Promise.resolve();
    } catch (error: any) {
      console.error("AuthContext: Sign in failed:", error);
      // Make sure to reject with the original error to allow proper handling in the component
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      console.log("Signing out...");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Sign out error:", error);
        throw error;
      }
      
      // Clear local state immediately for better UX
      setUser(null);
      setSession(null);
      
    } catch (error: any) {
      console.error("Sign out failed:", error);
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to get the appropriate redirect path based on user role
  const getRedirectPathByRole = (role?: string): string => {
    if (!role) return '/auth';
    
    switch (role) {
      case 'admin':
      case 'staff':
        return '/shop';
      case 'customer':
        return '/customer/profile';
      default:
        return '/auth';
    }
  };

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
