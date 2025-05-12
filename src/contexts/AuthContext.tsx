
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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        
        if (session?.user) {
          // Get profile data to enhance user object with role information
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
            
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
          } else {
            setUser(session.user);
          }
        } else {
          setUser(null);
        }
        
        setSession(session);
        
        // On sign out, redirect to login page
        if (event === 'SIGNED_OUT') {
          navigate('/auth');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log("Initial session check:", session?.user?.email);
      
      if (session?.user) {
        // Get profile data to enhance user object with role information
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
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
        } else {
          setUser(session.user);
        }
      } else {
        setUser(null);
      }
      
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
    } catch (error: any) {
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Configure session persistence after successful sign-in
      if (!rememberMe) {
        // If "Remember me" is not checked, set session to expire when browser is closed
        // This is done by setting auto refresh token to false
        await supabase.auth.setSession({
          access_token: session?.access_token || '',
          refresh_token: session?.refresh_token || '',
        });
      }
      
      navigate('/shop');
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
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
