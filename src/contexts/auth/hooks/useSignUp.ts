
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useSignUp() {
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

  return { signUp };
}
