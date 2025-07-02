
import { supabase } from '@/lib/supabase';

class AuthenticatorManager {
  /**
   * Get all authenticators for a user
   * @param userId User ID
   * @returns Array of authenticators
   */
  async getUserAuthenticators(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_authenticators')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching authenticators:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getUserAuthenticators:', error);
      return [];
    }
  }
  
  /**
   * Update the name of an authenticator
   * @param authenticatorId 
   * @param name 
   * @returns 
   */
  async updateAuthenticatorName(authenticatorId: string, name: string) {
    try {
      const { error } = await supabase
        .from('user_authenticators')
        .update({ device_name: name })
        .eq('id', authenticatorId);
      
      return !error;
    } catch (error) {
      console.error('Error updating authenticator name:', error);
      return false;
    }
  }
  
  /**
   * Delete an authenticator
   * @param authenticatorId Authenticator ID
   * @returns true if successful
   */
  async deleteAuthenticator(authenticatorId: string) {
    try {
      const { error } = await supabase
        .from('user_authenticators')
        .delete()
        .eq('id', authenticatorId);
      
      return !error;
    } catch (error) {
      console.error('Error deleting authenticator:', error);
      return false;
    }
  }
}

export const authenticatorManager = new AuthenticatorManager();
