
import React, { ReactNode, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AuthContextType } from './types';
import { useAuthStateListener } from './hooks';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user: authUser, session, loading: authLoading } = useAuthStateListener();
  const [loading, setLoading] = useState<boolean>(true);
  
  // Set up auto-authentication with a development admin user
  useEffect(() => {
    const autoSignIn = async () => {
      if (!authUser) {
        console.log('No active session found, performing automatic authentication...');
        
        try {
          // First check if the development user exists
          const { data: existingUser, error: checkError } = await supabase.auth.signInWithPassword({
            email: 'dev@example.com',
            password: 'devpassword123'
          });
          
          if (checkError) {
            console.log('Development user does not exist, creating one...');
            
            // Create the development user
            const { data, error: signUpError } = await supabase.auth.signUp({
              email: 'dev@example.com',
              password: 'devpassword123',
              options: {
                data: {
                  first_name: 'Dev',
                  last_name: 'User',
                  role: 'admin'
                }
              }
            });
            
            if (signUpError) {
              console.error('Error creating development user:', signUpError);
              toast({
                title: "Development Mode",
                description: "Could not create development user. Check console for details.",
                variant: "destructive"
              });
            } else {
              console.log('Development user created:', data.user?.email);
              toast({
                title: "Development Mode",
                description: "Created development user: dev@example.com / devpassword123",
              });
              
              // Sign in with the new user
              await supabase.auth.signInWithPassword({
                email: 'dev@example.com',
                password: 'devpassword123'
              });
            }
          } else {
            console.log('Signed in with development user:', existingUser.user?.email);
            toast({
              title: "Development Mode",
              description: "Auto-signed in as development user",
            });
          }
        } catch (error) {
          console.error('Auto-authentication error:', error);
        }
      } else {
        console.log('User already authenticated:', authUser.email);
      }
      
      setLoading(false);
    };
    
    // Only attempt auto-authentication when auth state is loaded
    if (!authLoading) {
      autoSignIn();
    }
  }, [authLoading, authUser, toast]);

  // Define fallback user for when authentication is still loading
  const devUser = {
    id: 'dev-user-id',
    email: 'dev@example.com',
    app_metadata: {
      role: 'admin'
    },
    user_metadata: {
      first_name: 'Dev',
      last_name: 'User',
      phone: '555-1234',
      role: 'admin'
    }
  };

  // Context value that matches AuthContextType
  const value: AuthContextType = {
    user: authUser || devUser,
    session: session,
    signUp: async (email: string, password: string, firstName = '', lastName = '') => {
      try {
        const metadata = { first_name: firstName, last_name: lastName };
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: metadata }
        });
        if (error) throw error;
        return { success: true, data };
      } catch (error: any) {
        console.error('Sign up error:', error);
        toast({
          variant: "destructive",
          title: "Sign up failed",
          description: error.message || "Failed to create account"
        });
        return { success: false, error };
      }
    },
    signIn: async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        if (error) throw error;
        return { success: true, data };
      } catch (error: any) {
        console.error('Sign in error:', error);
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.message || "Invalid credentials"
        });
        return { success: false, error };
      }
    },
    signOut: async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        navigate('/auth');
        return { success: true };
      } catch (error: any) {
        console.error('Sign out error:', error);
        toast({
          variant: "destructive",
          title: "Logout failed",
          description: error.message || "Failed to log out"
        });
        return { success: false, error };
      }
    },
    loading: loading || authLoading,
    getRedirectPathByRole: (role: string) => {
      return role === 'customer' ? '/customer/profile' : '/shop';
    },
    updateUserWithRole: undefined
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
