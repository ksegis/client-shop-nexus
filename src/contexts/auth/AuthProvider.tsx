
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
  
  // Define static mock user for development
  const mockUser = {
    id: 'mock-user-id',  // Using a string format that's for display only, not for DB queries
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
  
  // Set up automatic authentication for development
  useEffect(() => {
    const initializeAuth = async () => {
      // First check if we have a session
      if (authUser) {
        console.log('User already authenticated:', authUser.email);
        
        // Check if profile exists for RLS policies to work correctly
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', authUser.id)
            .maybeSingle();
          
          if (profileError || !profileData) {
            console.warn('Profile not found for authenticated user, creating one...');
            
            // Create profile if none exists (important for RLS policies)
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: authUser.id,
                email: authUser.email || '',
                role: authUser.user_metadata?.role || 'staff',
                first_name: authUser.user_metadata?.first_name || '',
                last_name: authUser.user_metadata?.last_name || ''
              });
              
            if (insertError) {
              console.error('Failed to create profile:', insertError);
            } else {
              console.log('Profile created successfully for RLS policies');
            }
          }
        } catch (err) {
          console.error('Error checking/creating profile:', err);
        }
      } else {
        console.log('Development mode: Using mock authentication');
        toast({
          title: "Development Mode",
          description: "Using mock authentication credentials",
        });
      }
      
      setLoading(false);
    };
    
    if (!authLoading) {
      initializeAuth();
    }
  }, [authLoading, authUser, toast]);

  // Create a properly typed user object that strictly conforms to our AuthContextType
  const userValue: AuthContextType['user'] = authUser ? {
    id: authUser.id,
    email: authUser.email || '', // Convert null to empty string to satisfy the type
    app_metadata: {
      role: authUser.app_metadata?.role || undefined
    },
    user_metadata: {
      first_name: authUser.user_metadata?.first_name || undefined,
      last_name: authUser.user_metadata?.last_name || undefined,
      phone: authUser.user_metadata?.phone || undefined,
      role: authUser.user_metadata?.role || undefined
    }
  } : mockUser;

  // Context value that matches AuthContextType
  const value: AuthContextType = {
    user: userValue,
    session: session,
    signUp: async (email: string, password: string, firstName = '', lastName = '') => {
      try {
        const metadata = { first_name: firstName, last_name: lastName, role: 'customer' };
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: metadata }
        });
        
        if (error) throw error;
        
        // Create profile for new user (important for RLS policies)
        if (data?.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            email,
            role: 'customer',
            first_name: firstName,
            last_name: lastName
          });
        }
        
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
        console.log(`Attempting to sign in with email: ${email}`);
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        
        if (error) {
          console.error('Sign in error:', error);
          throw error;
        }
        
        console.log('Sign in successful:', data.user?.email);
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
        console.log('Signing out user');
        const { error } = await supabase.auth.signOut();
        
        if (error) throw error;
        
        navigate('/auth');
        console.log('User signed out successfully');
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
