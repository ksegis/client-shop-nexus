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
                
                // Update local state with profile role
                setUser(prevUser => {
                  if (!prevUser) return null;
                  return {
                    ...prevUser,
                    app_metadata: {
                      ...prevUser.app_metadata,
                      role: profile.role
                    }
                  };
                });
                
                // Force redirection based on role
                redirectUserBasedOnRole(profile.role, location.pathname);
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
                
                // Update user with role from profile
                setUser(currentUser => {
                  if (!currentUser) return null;
                  
                  const updatedUser = {
                    ...currentUser,
                    app_metadata: {
                      ...currentUser.app_metadata,
                      role: profile.role
                    }
                  };
                  
                  return updatedUser;
                });
                
                // Check if user is on the correct portal for their role
                setTimeout(() => {
                  redirectUserBasedOnRole(profile.role, location.pathname);
                }, 0);
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
  }, [navigate, toast, location]);

  // Redirect user based on their role and current path
  const redirectUserBasedOnRole = (role: string, currentPath: string) => {
    console.log("Redirecting based on role:", role, "Current path:", currentPath);
    const isShopPath = currentPath.startsWith('/shop');
    const isCustomerPath = currentPath.startsWith('/customer');
    const isAuthPath = currentPath === '/auth' || currentPath === '/';
    
    // Only redirect if on an auth path or if trying to access wrong portal
    if (isAuthPath) {
      // Redirect from auth to appropriate portal
      if (role === 'customer') {
        navigate('/customer/profile', { replace: true });
      } else if (role === 'staff' || role === 'admin') {
        navigate('/shop', { replace: true });
      }
    } 
    // Strict enforcement of portal access based on role
    else if (role === 'customer' && isShopPath) {
      // Customer trying to access shop portal - redirect to customer portal
      console.log('Customer attempting to access shop portal - redirecting to customer portal');
      toast({
        title: "Access Restricted",
        description: "Customers can only access the Customer Portal.",
        variant: "destructive",
      });
      navigate('/customer/profile', { replace: true });
    } else if ((role === 'staff' || role === 'admin') && isCustomerPath) {
      // Staff/admin trying to access customer portal - redirect to shop portal
      console.log('Staff/admin attempting to access customer portal - redirecting to shop portal');
      toast({
        title: "Portal Changed",
        description: "Staff members use the Shop Management Portal.",
      });
      navigate('/shop', { replace: true });
    }
  };

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
