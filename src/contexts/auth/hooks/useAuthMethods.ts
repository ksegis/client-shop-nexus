
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
      console.log('Attempting to sign in with Supabase:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('Supabase signin error:', error);
        throw error;
      }
      
      console.log('Supabase signin successful:', data.user.email);
      
      toast({
        title: "Login successful",
        description: "Welcome back!"
      });
      
      return { success: true, data };
    } catch (error) {
      console.error('Sign in error details:', error);
      
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Invalid credentials"
      });
      
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
