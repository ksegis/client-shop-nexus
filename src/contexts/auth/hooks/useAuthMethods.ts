
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export function useAuthMethods() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      setLoading(true);
      console.log("Attempting signup for:", email);
      
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        }
      });

      if (error) throw error;
      
      toast({
        title: "Account created",
        description: "Please check your email to confirm your account.",
      });
      
      return Promise.resolve();
    } catch (error: any) {
      console.error("Signup error:", error.message);
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive",
      });
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      console.log("AuthContext: Signing in with email:", email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        throw error;
      }
      
      console.log("AuthContext: Sign in successful:", data.user?.email);
      
      // Configure session persistence after successful sign-in
      if (!rememberMe && data.session) {
        try {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        } catch (sessionError) {
          console.error("Error setting session persistence:", sessionError);
        }
      }
      
      // We don't navigate here - let the component handle navigation
      return Promise.resolve();
    } catch (error: any) {
      console.error("AuthContext: Sign in failed:", error);
      // Make sure to reject with the original error to allow proper handling in the component
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      console.log("Signing out...");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Sign out error:", error);
        throw error;
      }
      
    } catch (error: any) {
      console.error("Sign out failed:", error);
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { signUp, signIn, signOut };
}
