
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';

// Store original user information when impersonating
let originalUser: User | null = null;

/**
 * Start impersonating a user with the specified ID
 * @param userId The ID of the user to impersonate
 * @returns A promise that resolves when impersonation starts
 */
export const startImpersonation = async (userId: string): Promise<boolean> => {
  try {
    // Store current session for later restoration
    const { data: currentSession } = await supabase.auth.getSession();
    
    if (currentSession?.session?.user) {
      originalUser = currentSession.session.user;
    }
    
    // Use special admin function to impersonate user
    const { data, error } = await supabase.functions.invoke('impersonate-user', {
      body: { user_id: userId }
    });
    
    if (error) throw error;
    
    // Update session with impersonated user token
    if (data?.access_token && data?.refresh_token) {
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token
      });
      
      return true;
    }
    
    throw new Error('Failed to retrieve impersonation tokens');
  } catch (error) {
    console.error('Impersonation error:', error);
    return false;
  }
};

/**
 * Stop impersonating and return to original user
 * @returns A promise that resolves when impersonation ends
 */
export const stopImpersonation = async (): Promise<boolean> => {
  try {
    if (!originalUser) {
      throw new Error('No original user found to restore');
    }
    
    // Sign out impersonated session
    await supabase.auth.signOut();
    
    // Restore original session
    const { data, error } = await supabase.functions.invoke('restore-admin', {
      body: { admin_id: originalUser.id }
    });
    
    if (error) throw error;
    
    if (data?.access_token && data?.refresh_token) {
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token
      });
      
      originalUser = null;
      return true;
    }
    
    throw new Error('Failed to restore original user session');
  } catch (error) {
    console.error('Stop impersonation error:', error);
    return false;
  }
};

/**
 * Check if current session is an impersonation
 * @returns Boolean indicating if current session is impersonated
 */
export const isImpersonating = (): boolean => {
  return originalUser !== null;
};

/**
 * Get original admin user information
 * @returns Original admin user or null if not impersonating
 */
export const getOriginalUser = (): User | null => {
  return originalUser;
};

/**
 * Hook to provide impersonation functionality
 */
export const useImpersonation = () => {
  const { toast } = useToast();

  const impersonateUser = async (userId: string, userName: string) => {
    const success = await startImpersonation(userId);
    
    if (success) {
      toast({
        title: "Impersonation Active",
        description: `You are now viewing as ${userName}`,
        variant: "default",
      });
      return true;
    } else {
      toast({
        title: "Impersonation Failed",
        description: "Unable to impersonate user. Check console for details.",
        variant: "destructive",
      });
      return false;
    }
  };

  const stopImpersonatingUser = async () => {
    const success = await stopImpersonation();
    
    if (success) {
      toast({
        title: "Impersonation Ended",
        description: "You are now back to your admin account",
        variant: "default",
      });
      return true;
    } else {
      toast({
        title: "Error",
        description: "Unable to stop impersonation. Check console for details.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    impersonateUser,
    stopImpersonatingUser,
    isImpersonating,
    getOriginalUser
  };
};
