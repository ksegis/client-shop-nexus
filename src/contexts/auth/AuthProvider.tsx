
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
    setLoading(false);
    
    // For development, just log that we're using mock auth
    if (!authUser) {
      console.log('Development mode: Using mock authentication');
      toast({
        title: "Development Mode",
        description: "Using mock authentication credentials",
      });
    } else {
      console.log('User already authenticated:', authUser.email);
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
