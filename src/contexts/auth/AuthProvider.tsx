
import React, { ReactNode, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AuthContextType, AuthResult, UserProfile } from './types';
import { useAuthStateListener, useAuthMethods } from './hooks';
import { User } from '@supabase/supabase-js';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user: authUser, session, loading: authLoading } = useAuthStateListener();
  const { signUp: authSignUp, signIn: authSignIn, signOut: authSignOut, impersonateCustomer: authImpersonateCustomer } = useAuthMethods();
  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isDevMode, setIsDevMode] = useState<boolean>(false);
  
  // Define static mock user for development
  const mockUser = {
    id: 'mock-user-id',
    email: 'dev@example.com',
    app_metadata: {
      role: 'admin'
    },
    user_metadata: {
      first_name: 'Dev',
      last_name: 'User',
      phone: '555-1234',
      role: 'admin'
    },
    aud: 'authenticated',
    created_at: new Date().toISOString()
  } as User;
  
  // Define mock customer user for development
  const mockCustomerUser = localStorage.getItem('dev-customer-user') 
    ? JSON.parse(localStorage.getItem('dev-customer-user')!) as User 
    : null;
  
  // Check if we should use dev customer mode
  const useDevCustomer = !!mockCustomerUser;
  
  // Select the appropriate mock user
  const devUser = useDevCustomer ? mockCustomerUser : mockUser;
  
  // Create appropriate mock profile
  const mockProfile: UserProfile = {
    id: devUser.id,
    email: devUser.email || '',
    first_name: devUser.user_metadata?.first_name || '',
    last_name: devUser.user_metadata?.last_name || '',
    role: devUser.user_metadata?.role as 'admin' | 'staff' | 'customer'
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
            .select('id, email, first_name, last_name, role')
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
          } else {
            setProfile(profileData as UserProfile);
          }
        } catch (err) {
          console.error('Error checking/creating profile:', err);
        }
      } else {
        console.log('Development mode: Using mock authentication');
        setProfile(mockProfile);
        setIsDevMode(true);
        
        if (useDevCustomer) {
          toast({
            title: "Customer Development Mode",
            description: "Using mock customer authentication credentials",
          });
        } else {
          toast({
            title: "Development Mode",
            description: "Using mock authentication credentials",
          });
        }
      }
      
      setLoading(false);
    };
    
    if (!authLoading) {
      initializeAuth();
    }
  }, [authLoading, authUser, toast, useDevCustomer]);

  // Context value that matches AuthContextType
  const value: AuthContextType = {
    user: authUser || devUser,
    profile,
    session,
    isLoading: loading || authLoading,
    isAuthenticated: !!authUser || !!devUser,
    isDevMode,
    signUp: async (email: string, password: string, firstName = '', lastName = ''): Promise<AuthResult> => {
      try {
        const metadata = { first_name: firstName, last_name: lastName, role: 'customer' };
        const result = await authSignUp({ email, password, metadata });
        
        if (!result.success) throw result.error;
        
        // Create profile for new user (important for RLS policies)
        if (result.data?.user) {
          await supabase.from('profiles').insert({
            id: result.data.user.id,
            email,
            role: 'customer',
            first_name: firstName,
            last_name: lastName
          });
        }
        
        return { success: true, data: result.data };
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
    signIn: async (email: string, password: string, rememberMe = false): Promise<AuthResult> => {
      return await authSignIn({ email, password });
    },
    signOut: async (): Promise<AuthResult> => {
      // If in dev customer mode, clear the localStorage
      if (useDevCustomer) {
        localStorage.removeItem('dev-customer-user');
        window.location.reload();
        return { success: true };
      }
      
      const result = await authSignOut();
      
      if (result.success) {
        navigate('/auth');
      }
      
      return result;
    },
    resetPassword: async (email: string): Promise<AuthResult> => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/customer/reset-password'
        });
        
        if (error) throw error;
        
        return { success: true };
      } catch (error: any) {
        return { success: false, error };
      }
    },
    updatePassword: async (password: string): Promise<AuthResult> => {
      try {
        const { error } = await supabase.auth.updateUser({ password });
        
        if (error) throw error;
        
        return { success: true };
      } catch (error: any) {
        return { success: false, error };
      }
    },
    getRedirectPathByRole: (role: string) => {
      return role === 'customer' ? '/customer/profile' : '/shop';
    },
    impersonateCustomer: () => {
      authImpersonateCustomer();
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
