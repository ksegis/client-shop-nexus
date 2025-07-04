import { ReactNode, useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, handleAuthError, logAuthEvent } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import type { UserRole } from './types';

interface Profile {
  id: string;
  role: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone?: string;
}

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  portalType: 'shop' | 'customer' | null;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  validateAccess: (allowedRoles?: UserRole[]) => boolean;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

interface SupabaseAuthProviderProps {
  children: ReactNode;
}

export function SupabaseAuthProvider({ children }: SupabaseAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Determine portal type based on user role
  const portalType: 'shop' | 'customer' | null = profile?.role === 'customer' ? 'customer' : profile?.role ? 'shop' : null;

  // Validate access based on user role
  const validateAccess = (allowedRoles?: UserRole[]) => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    if (!profile?.role) return false;
    return allowedRoles.includes(profile.role as UserRole);
  };

  // Fetch user profile when user changes
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching profile:', error);
          } else {
            setProfile(data);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      };

      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [user]);

  useEffect(() => {
    console.log('[Supabase Auth] Initializing auth provider');
    
    // Override any EGIS auth initialization
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      if (args.some(arg => typeof arg === 'string' && arg.includes('EGIS'))) {
        console.warn('[Supabase Auth] Blocked EGIS log:', ...args);
        return;
      }
      originalConsoleLog(...args);
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Supabase Auth] Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          logAuthEvent('user_signed_in', session.user.id);
        } else if (event === 'SIGNED_OUT') {
          logAuthEvent('user_signed_out');
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[Supabase Auth] Error getting session:', error);
      } else {
        console.log('[Supabase Auth] Initial session:', session?.user?.email || 'No session');
        setSession(session);
        setUser(session?.user ?? null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      console.log = originalConsoleLog;
    };
  }, []);

  const signIn = async (email: string, password: string, rememberMe?: boolean) => {
    try {
      console.log('[Supabase Auth] Signing in user:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const errorMessage = handleAuthError(error);
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: errorMessage,
        });
        return { success: false, error: errorMessage };
      }

      if (data.user) {
        toast({
          title: "Signed in successfully",
          description: `Welcome back, ${data.user.email}`,
        });
        
        // Navigate to appropriate dashboard
        setTimeout(() => {
          navigate('/shop/dashboard', { replace: true });
        }, 100);
      }

      return { success: true };
    } catch (error: any) {
      const errorMessage = handleAuthError(error);
      return { success: false, error: errorMessage };
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      console.log('[Supabase Auth] Signing up user:', email);
      const metadata: any = {};
      if (firstName) metadata.first_name = firstName;
      if (lastName) metadata.last_name = lastName;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        const errorMessage = handleAuthError(error);
        toast({
          variant: "destructive",
          title: "Sign up failed",
          description: errorMessage,
        });
        return { success: false, error: errorMessage };
      }

      toast({
        title: "Account created",
        description: "Please check your email to confirm your account.",
      });

      return { success: true };
    } catch (error: any) {
      const errorMessage = handleAuthError(error);
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      console.log('[Supabase Auth] Signing out user');
      const { error } = await supabase.auth.signOut();

      if (error) {
        const errorMessage = handleAuthError(error);
        toast({
          variant: "destructive",
          title: "Sign out failed",
          description: errorMessage,
        });
        return { success: false, error: errorMessage };
      }

      toast({
        title: "Signed out",
        description: "You have been logged out successfully.",
      });

      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);

      return { success: true };
    } catch (error: any) {
      const errorMessage = handleAuthError(error);
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('[Supabase Auth] Requesting password reset for:', email);
      
      // Use the direct URL to the reset password page
      const redirectTo = `https://ctc.modworx.online/auth/reset-password`;
      console.log('[Supabase Auth] Reset redirect URL:', redirectTo);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
      });

      if (error) {
        const errorMessage = handleAuthError(error);
        console.error('[Supabase Auth] Reset password error:', error);
        // Still show success message for security (don't reveal if email exists)
        toast({
          title: "Password reset requested",
          description: "If your email address is registered with us, you will receive password reset instructions within a few minutes. Please check your email and click the reset link.",
        });
        return { success: true }; // Always return success for security
      }

      toast({
        title: "Password reset requested",
        description: "If your email address is registered with us, you will receive password reset instructions within a few minutes. Please check your email and click the reset link.",
      });

      return { success: true };
    } catch (error: any) {
      console.error('[Supabase Auth] Reset password exception:', error);
      // Still show success message for security
      toast({
        title: "Password reset requested", 
        description: "If your email address is registered with us, you will receive password reset instructions within a few minutes. Please check your email and click the reset link.",
      });
      return { success: true };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      console.log('[Supabase Auth] Updating password');
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        const errorMessage = handleAuthError(error);
        toast({
          variant: "destructive",
          title: "Password update failed",
          description: errorMessage,
        });
        return { success: false, error: errorMessage };
      }

      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });

      // Navigate to dashboard after successful password update
      setTimeout(() => {
        navigate('/shop/dashboard', { replace: true });
      }, 1000);

      return { success: true };
    } catch (error: any) {
      const errorMessage = handleAuthError(error);
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated: !!user,
    portalType,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    validateAccess,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}

export type { SupabaseAuthContextType };
