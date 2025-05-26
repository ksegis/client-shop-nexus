
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Helper functions for user impersonation in admin interface
export const useImpersonation = () => {
  const { toast } = useToast();

  const isImpersonating = (): boolean => {
    return localStorage.getItem('impersonation-session') !== null;
  };

  const getImpersonatedUser = () => {
    const impersonationData = localStorage.getItem('impersonation-session');
    if (!impersonationData) return null;
    
    try {
      return JSON.parse(impersonationData);
    } catch {
      return null;
    }
  };

  const impersonateUser = async (userId: string, userName: string): Promise<boolean> => {
    try {
      // In a real production app, this would use admin API 
      // Here we're just simulating by storing the user info in localStorage
      // with a special key to indicate it's an impersonation session
      
      // Fetch the user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        toast({
          title: "Error",
          description: "Failed to fetch user profile for impersonation",
          variant: "destructive"
        });
        return false;
      }
      
      // Create an impersonation record
      const impersonationData = {
        id: userId,
        email: profile.email,
        user_metadata: {
          first_name: profile.first_name,
          last_name: profile.last_name,
          role: profile.role,
          impersonated: true,
          original_user: supabase.auth.getUser()
        },
        created_at: new Date().toISOString()
      };
      
      // Store the impersonation data
      localStorage.setItem('impersonation-session', JSON.stringify(impersonationData));
      
      toast({
        title: "Impersonation Active",
        description: `You are now viewing as ${userName}. Remember to exit impersonation when done.`,
      });
      
      return true;
    } catch (error) {
      console.error('Impersonation error:', error);
      toast({
        title: "Error",
        description: "Failed to start impersonation session",
        variant: "destructive"
      });
      return false;
    }
  };

  const exitImpersonation = () => {
    // Remove the impersonation session
    localStorage.removeItem('impersonation-session');
    
    toast({
      title: "Impersonation Ended",
      description: "You have returned to your admin account.",
    });
    
    // Reload the page to ensure clean state
    window.location.reload();
  };

  return {
    impersonateUser,
    exitImpersonation,
    isImpersonating,
    getImpersonatedUser
  };
};
