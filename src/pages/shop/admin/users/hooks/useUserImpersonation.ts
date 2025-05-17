
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logAuthEvent } from '@/integrations/supabase/client';

export const useUserImpersonation = () => {
  const [impersonationLoading, setImpersonationLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const impersonateUser = async (userId: string, userEmail: string) => {
    try {
      setImpersonationLoading(userId);
      
      // Log the impersonation attempt
      await logAuthEvent('impersonation_attempt', userId, { 
        target_user_id: userId, 
        target_email: userEmail 
      });
      
      // Get the current user session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const adminId = currentSession?.user?.id;
      
      // Store the admin session in local storage for restoration later
      if (currentSession) {
        localStorage.setItem('admin_session', JSON.stringify({
          access_token: currentSession.access_token,
          refresh_token: currentSession.refresh_token,
          admin_id: adminId
        }));
      }
      
      // Sign in as the target user
      // Note: This is a simplified approach. In a production environment, you would
      // typically use an edge function to handle the actual impersonation securely
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: 'this-is-not-the-real-password-impersonation-mode'
      });
      
      if (error) {
        // If standard login fails, try a token-based approach
        // This would typically be handled through an edge function in production
        toast({
          title: "Impersonation Error",
          description: "Could not impersonate user. The user may need to reset their password first.",
          variant: "destructive",
        });
        
        // Log the failure
        await logAuthEvent('impersonation_failed', adminId, { 
          target_user_id: userId, 
          target_email: userEmail,
          error: error.message
        });
        
        return false;
      }
      
      // Log successful impersonation
      await logAuthEvent('impersonation_success', adminId, { 
        target_user_id: userId, 
        target_email: userEmail
      });
      
      toast({
        title: "Impersonation Active",
        description: `You are now acting as ${userEmail}. Remember to exit this mode when done.`,
        variant: "default",
      });
      
      // Set a flag in localStorage to indicate impersonation mode
      localStorage.setItem('impersonation_active', 'true');
      localStorage.setItem('impersonated_user', userEmail);
      
      return true;
    } catch (error: any) {
      console.error('Impersonation error:', error);
      
      toast({
        title: "Impersonation Error",
        description: error.message || "An error occurred during impersonation",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setImpersonationLoading(null);
    }
  };

  const exitImpersonationMode = async () => {
    try {
      // Retrieve the admin session from local storage
      const adminSessionStr = localStorage.getItem('admin_session');
      
      if (!adminSessionStr) {
        toast({
          title: "Exit Error",
          description: "Could not find original session information",
          variant: "destructive",
        });
        return false;
      }
      
      const adminSession = JSON.parse(adminSessionStr);
      
      // Sign out current (impersonated) user
      await supabase.auth.signOut();
      
      // Restore admin session manually
      // In a production environment, this would typically use a secure edge function
      const { data, error } = await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token
      });
      
      if (error) {
        toast({
          title: "Session Restoration Failed",
          description: "Could not restore your original session. Please log in again.",
          variant: "destructive",
        });
        
        // Clean up impersonation data
        localStorage.removeItem('admin_session');
        localStorage.removeItem('impersonation_active');
        localStorage.removeItem('impersonated_user');
        
        return false;
      }
      
      // Log the end of impersonation
      await logAuthEvent('impersonation_ended', adminSession.admin_id);
      
      toast({
        title: "Original Session Restored",
        description: "You are now back to your admin account",
        variant: "default",
      });
      
      // Clean up impersonation data
      localStorage.removeItem('admin_session');
      localStorage.removeItem('impersonation_active');
      localStorage.removeItem('impersonated_user');
      
      return true;
    } catch (error: any) {
      console.error('Error exiting impersonation:', error);
      
      toast({
        title: "Error Exiting Impersonation",
        description: error.message || "Could not exit impersonation mode",
        variant: "destructive",
      });
      
      return false;
    }
  };

  const isImpersonationActive = () => {
    return localStorage.getItem('impersonation_active') === 'true';
  };

  const getImpersonatedUser = () => {
    return localStorage.getItem('impersonated_user');
  };

  return { 
    impersonateUser, 
    exitImpersonationMode,
    impersonationLoading,
    isImpersonationActive,
    getImpersonatedUser
  };
};
