
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export function useSignIn() {
  const { toast } = useToast();

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

  return { signIn };
}
