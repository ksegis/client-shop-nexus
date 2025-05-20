
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
      
      // If there's an error from Supabase, throw it to be caught below
      if (error) {
        console.error('Authentication error:', error);
        throw error;
      }
      
      // Check if we got valid user data back
      if (!data || !data.user) {
        console.error('No user data returned from authentication');
        throw new Error('Authentication failed');
      }
      
      // Authentication succeeded, log success but don't show toast yet
      // Toast will be shown by useAuthActions after profile is loaded
      console.log('Authentication successful for:', data.user.email);
      
      return { success: true, data };
    } catch (error) {
      // Log the error details for debugging
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
    impersonateCustomer
  };
}
