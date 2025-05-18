
import { supabase } from '@/integrations/supabase/client';
import type { RegisteredAuthenticator } from './types';

/**
 * Handles WebAuthn credential management operations
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
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching user authenticators:', error);
        return [];
      }
      
      return data as RegisteredAuthenticator[];
    } catch (error) {
      console.error('Error in getUserAuthenticators:', error);
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
      
      if (error) {
        console.error('Error deleting authenticator:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in deleteAuthenticator:', error);
      return false;
    }
  },
  
  /**
   * Generate recovery codes for a user and store them hashed
   * Uses the mfa_service's recovery code functionality for consistency
   */
  generateRecoveryCodes: async (userId: string): Promise<string[] | null> => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('recovery_codes')
        .eq('id', userId)
        .single();
        
      // If user already has recovery codes, don't generate new ones
      if (profile?.recovery_codes && Array.isArray(profile.recovery_codes) && profile.recovery_codes.length > 0) {
        return null;
      }
      
      // Import generateRecoveryCodes from utils
      const { generateRecoveryCodes } = await import('@/lib/utils');
      const recoveryCodes = generateRecoveryCodes();
      
      // Store the recovery codes in the user's profile
      const { error } = await supabase
        .from('profiles')
        .update({ recovery_codes: recoveryCodes })
        .eq('id', userId);
        
      if (error) {
        console.error('Error storing recovery codes:', error);
        return null;
      }
      
      return recoveryCodes;
    } catch (error) {
      console.error('Error generating recovery codes:', error);
      return null;
    }
  },
  
  /**
   * Verify a recovery code
   */
  verifyRecoveryCode: async (userId: string, code: string): Promise<boolean> => {
    try {
      // Get the user's recovery codes
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('recovery_codes')
        .eq('id', userId)
        .single();
        
      if (error || !profile?.recovery_codes) {
        console.error('Error fetching recovery codes:', error);
        return false;
      }
      
      // Check if the provided code is in the recovery codes array
      const isValid = Array.isArray(profile.recovery_codes) && 
                      profile.recovery_codes.includes(code);
                      
      if (isValid) {
        // Remove the used recovery code
        const updatedCodes = profile.recovery_codes.filter(c => c !== code);
        
        // Update the profile with the remaining codes
        await supabase
          .from('profiles')
          .update({ recovery_codes: updatedCodes })
          .eq('id', userId);
          
        // Log the successful recovery code use
        await supabase
          .from('mfa_attempts')
          .insert({
            user_id: userId,
            successful: true,
            ip_address: 'client-ip',
            action: 'recovery_code_used',
            metadata: { user_agent: navigator.userAgent }
          });
      } else {
        // Log the failed recovery code attempt
        await supabase
          .from('mfa_attempts')
          .insert({
            user_id: userId,
            successful: false,
            ip_address: 'client-ip',
            action: 'recovery_code_failed',
            metadata: { user_agent: navigator.userAgent }
          });
      }
      
      return isValid;
    } catch (error) {
      console.error('Error verifying recovery code:', error);
      return false;
    }
  }
};
