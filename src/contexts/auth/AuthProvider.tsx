
import React, { ReactNode, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AuthContextType } from './types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Set up auto-authentication with a mock admin user for development
  useEffect(() => {
    const autoSignIn = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If no active session, perform automatic authentication
      if (!session) {
        console.log('No active session found, performing automatic authentication...');
        
        try {
          // Try to sign in using a mock session for development
          const { data, error } = await supabase.auth.signInWithPassword({
            email: 'admin@example.com',
            password: 'password123'
          });
          
          if (error) {
            console.log('Could not auto-sign in, attempting to create mock user...');
            
            // If user doesn't exist, create one
            const { error: signUpError } = await supabase.auth.signUp({
              email: 'admin@example.com',
              password: 'password123',
              options: {
                data: {
                  role: 'admin',
                  first_name: 'Admin',
                  last_name: 'User'
                }
              }
            });
            
            if (signUpError) {
              console.error('Error creating mock user:', signUpError);
              toast({
                title: "Development Mode",
                description: "For development: Please create a user with email 'admin@example.com' and password 'password123'",
                variant: "destructive"
              });
            } else {
              toast({
                title: "Development Mode",
                description: "Created mock admin account for development",
              });
              
              // Try signing in again
              await supabase.auth.signInWithPassword({
                email: 'admin@example.com',
                password: 'password123'
              });
            }
          } else {
            console.log('Auto-signed in with development account');
          }
        } catch (error) {
          console.error('Auto-authentication error:', error);
        }
      } else {
        console.log('Active session found:', session.user.email);
      }
    };
    
    // Attempt auto-authentication on component mount
    autoSignIn();
  }, []);
  
  // Mock user with admin role for development (fallback if auto-auth fails)
  const mockUser = {
    id: 'mock-user-id',
    email: 'admin@example.com',
    app_metadata: {
      role: 'admin' // Admin role for full access
    },
    user_metadata: {
      first_name: 'Admin',
      last_name: 'User',
      phone: '555-1234',
      role: 'admin'
    }
  };

  // Context value that matches AuthContextType
  const value: AuthContextType = {
    user: mockUser,
    session: null,
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
    loading: false,
    getRedirectPathByRole: (role: string) => {
      return role === 'customer' ? '/customer/profile' : '/shop';
    },
    updateUserWithRole: undefined
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
