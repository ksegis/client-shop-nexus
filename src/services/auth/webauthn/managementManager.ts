
import { supabase } from '@/integrations/supabase/client';
import type { RegisteredAuthenticator } from './types';

/**
 * Handles WebAuthn authenticator management
 */
export const managementManager = {
  /**
   * Get all registered authenticators for a user
   */
  getUserAuthenticators: async (userId: string): Promise<RegisteredAuthenticator[]> => {
    try {
      const { data, error } = await supabase
        .from('user_authenticators')
        .select('id, credential_id, device_name, created_at, last_used_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching user authenticators:', error);
      return [];
    }
  },
  
  /**
   * Delete a registered authenticator
   */
  deleteAuthenticator: async (authenticatorId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_authenticators')
        .delete()
        .eq('id', authenticatorId);
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error deleting authenticator:', error);
      return false;
    }
  }
};
