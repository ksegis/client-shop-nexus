import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Simple rate limiting storage
const resetAttempts = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT = 3; // Max attempts per email
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

export function useAuthMethods() {
  const { toast } = useToast();

  const signUp = async ({ email, password, metadata = {} }) => {
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: metadata }
      });
      
      if (error) throw error;
      
      toast({
        title: "Account created",
        description: "Please check your email to verify your account."
      });
      
      return { success: true, data };
    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message || "Failed to create account"
      });
      return { success: false, error };
    }
  };
  
  const signIn = async ({ email, password }) => {
    try {
      console.log('Attempting to sign in with:', email);
      
      // Make the authentication request to Supabase
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      // If there's an error from Supabase, throw it
      if (error) {
        console.error('Authentication error:', error);
        throw error;
      }
      
      // Check if we got valid user data back
      if (!data || !data.user) {
        console.error('No user data returned from authentication');
        throw new Error('Authentication failed');
      }
      
      console.log('Authentication successful for:', data.user.email);
      
      // Don't show success toast here, it will be shown after profile checks and role detection
      
      return { success: true, data };
    } catch (error) {
      // Log the error for debugging
      console.error('Sign in failed:', error);
      
      // Show error toast to user
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Invalid credentials"
      });
      
      // Return failure result
      return { success: false, error };
    }
  };
  
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out."
      });
      
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: error.message || "Failed to log out"
      });
      return { success: false, error };
    }
  };

  const checkRateLimit = (email: string): boolean => {
    const now = Date.now();
    const emailKey = email.toLowerCase();
    const attempts = resetAttempts.get(emailKey);
    
    if (!attempts) {
      resetAttempts.set(emailKey, { count: 1, lastAttempt: now });
      return true;
    }
    
    // Reset counter if window has passed
    if (now - attempts.lastAttempt > RATE_LIMIT_WINDOW) {
      resetAttempts.set(emailKey, { count: 1, lastAttempt: now });
      return true;
    }
    
    // Check if under rate limit
    if (attempts.count < RATE_LIMIT) {
      attempts.count++;
      attempts.lastAttempt = now;
      return true;
    }
    
    return false;
  };

  const resetPassword = async (email) => {
    try {
      console.log('=== PASSWORD RESET DEBUG START ===');
      console.log('Email requested for reset:', email);
      console.log('Current timestamp:', new Date().toISOString());
      
      // Check rate limiting
      if (!checkRateLimit(email)) {
        console.log('Rate limit exceeded for email:', email);
        toast({
          variant: "destructive",
          title: "Too many requests",
          description: "Please wait 15 minutes before requesting another password reset."
        });
        return { success: false, error: new Error('Rate limit exceeded') };
      }
      
      // Use the correct redirect URL that points directly to the change password page
      const redirectTo = `${window.location.origin}/auth/change-password`;
      console.log('Redirect URL configured:', redirectTo);
      console.log('Window location origin:', window.location.origin);
      
      console.log('Calling Supabase resetPasswordForEmail...');
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo
      });
      
      console.log('Supabase response data:', data);
      console.log('Supabase response error:', error);
      
      // Always show success message for security (don't reveal if email exists)
      toast({
        title: "Password reset requested",
        description: "If your email address is registered with us, you will receive password reset instructions within a few minutes. Please check your inbox and spam folder."
      });
      
      if (error) {
        console.error('Supabase resetPasswordForEmail error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error status:', error.status);
        // Don't throw error to user - always show success message for security
      }
      
      console.log('Password reset request completed');
      console.log('=== PASSWORD RESET DEBUG END ===');
      
      // Always return success to prevent email enumeration
      return { success: true };
    } catch (error) {
      console.error('=== PASSWORD RESET ERROR ===');
      console.error('Password reset error:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error.constructor.name);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      console.error('=== PASSWORD RESET ERROR END ===');
      
      // Still show success message for security
      toast({
        title: "Password reset requested",
        description: "If your email address is registered with us, you will receive password reset instructions within a few minutes. Please check your inbox and spam folder."
      });
      
      return { success: true }; // Always return success for security
    }
  };

  const impersonateCustomer = () => {
    // This is a development-only function to create a mock customer user
    const mockCustomerUser = {
      id: 'dev-customer-user-id',
      email: 'customer@example.com',
      app_metadata: {
        role: 'customer'
      },
      user_metadata: {
        first_name: 'Dev',
        last_name: 'Customer',
        phone: '555-5678',
        role: 'customer'
      },
      aud: 'authenticated',
      created_at: new Date().toISOString()
    };
    
    console.log('Switching to dev customer mode');
    
    // Store the mock user in localStorage for development
    localStorage.setItem('dev-customer-user', JSON.stringify(mockCustomerUser));
    
    // Force a page reload to apply the dev customer mode
    window.location.reload();
  };

  return {
    signUp,
    signIn,
    signOut,
    resetPassword,
    impersonateCustomer
  };
}
