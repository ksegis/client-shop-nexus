
import { ReactNode, useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, handleAuthError, logAuthEvent } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

interface SupabaseAuthProviderProps {
  children: ReactNode;
}

export function SupabaseAuthProvider({ children }: SupabaseAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const signIn = async (email: string, password: string) => {
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

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      console.log('[Supabase Auth] Signing up user:', email);
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
      
      const redirectTo = `${window.location.origin}/auth/reset-password`;
      console.log('[Supabase Auth] Reset redirect URL:', redirectTo);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
      });

      if (error) {
        const errorMessage = handleAuthError(error);
        // Still show success message for security (don't reveal if email exists)
        toast({
          title: "Password reset requested",
          description: "If your email address is registered with us, you will receive password reset instructions within a few minutes.",
        });
        return { success: true }; // Always return success for security
      }

      toast({
        title: "Password reset requested",
        description: "If your email address is registered with us, you will receive password reset instructions within a few minutes.",
      });

      return { success: true };
    } catch (error: any) {
      // Still show success message for security
      toast({
        title: "Password reset requested",
        description: "If your email address is registered with us, you will receive password reset instructions within a few minutes.",
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
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
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
