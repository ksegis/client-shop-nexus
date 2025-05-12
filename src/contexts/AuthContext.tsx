
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Setting up auth state listener");
    let authStateSubscription: { unsubscribe: () => void };
    
    try {
      // Set up auth state listener FIRST
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log("Auth state changed:", event, session?.user?.email);
          
          if (session?.user) {
            // Handle synchronous state updates immediately
            setUser(session.user);
            setSession(session);
            setLoading(false);
            
            // Use setTimeout to prevent potential deadlock with Supabase client
            if (session.user.id) {
              setTimeout(async () => {
                try {
                  // Get profile data to enhance user object with role information
                  const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();
                    
                  if (profileError) {
                    console.error("Error fetching profile:", profileError);
                    return;
                  }
                  
                  // If we have profile data with a role, add it to the user's metadata
                  if (profile?.role) {
                    // Update the user object with role from profile
                    const updatedUser = {
                      ...session.user,
                      app_metadata: {
                        ...session.user.app_metadata,
                        role: profile.role
                      }
                    };
                    setUser(updatedUser);
                    console.log("Updated user with role from profile:", profile.role);
                  }
                } catch (error) {
                  console.error("Error in profile fetch after auth change:", error);
                }
              }, 0);
            }
          } else {
            setUser(null);
            setSession(null);
            setLoading(false);
          }
          
          // On sign out, redirect to login page
          if (event === 'SIGNED_OUT') {
            navigate('/shop/login', { replace: true });
          }
        }
      );
      
      authStateSubscription = subscription;
    } catch (error) {
      console.error("Error setting up auth listener:", error);
      setLoading(false);
    }

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log("Initial session check:", session?.user?.email);
      
      if (session?.user) {
        // Set user and session state immediately
        setUser(session.user);
        setSession(session);
        
        // Fetch profile data separately to avoid deadlocks
        setTimeout(async () => {
          try {
            // Get profile data to enhance user object with role information
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single();
              
            if (profileError) {
              console.error("Error fetching profile:", profileError);
              setLoading(false);
              return;
            }
              
            // If we have profile data with a role, add it to the user's metadata
            if (profile?.role) {
              // Update the user object with role from profile
              const updatedUser = {
                ...session.user,
                app_metadata: {
                  ...session.user.app_metadata,
                  role: profile.role
                }
              };
              setUser(updatedUser);
              console.log("Initial: Updated user with role from profile:", profile.role);
            }
          } catch (error) {
            console.error("Error in initial profile fetch:", error);
          } finally {
            setLoading(false);
          }
        }, 0);
      } else {
        // No session found
        setUser(null);
        setSession(null);
        setLoading(false);
      }
    }).catch(error => {
      console.error("Failed to get session:", error);
      setLoading(false);
    });

    return () => {
      if (authStateSubscription) {
        authStateSubscription.unsubscribe();
      }
    };
  }, [navigate]);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      setLoading(true);
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
        // If "Remember me" is not checked, set session to expire when browser is closed
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }
      
      // We don't navigate here - let the component handle navigation
      return Promise.resolve();
    } catch (error: any) {
      console.error("AuthContext: Sign in failed:", error);
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
