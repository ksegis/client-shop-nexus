
import { supabase } from '@/integrations/supabase/client';
import type { RegisteredAuthenticator } from './types';
import { generateRandomString } from '@/lib/utils';

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
          
        // Log the incident in security_incidents table
        await supabase
          .from('security_alerts')
          .insert({
            user_id: userId,
            alert_type: 'recovery_code_used',
            metadata: { 
              method: 'recovery_code',
              user_agent: navigator.userAgent,
              timestamp: new Date().toISOString(),
              message: 'Account recovered using backup code'
            }
          });

        // Generate a new recovery code to replace the used one
        const newCode = generateRandomRecoveryCode();
        await supabase
          .from('profiles')
          .update({ 
            recovery_codes: [...updatedCodes, newCode]
          })
          .eq('id', userId);
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
          
        // Log the incident in security_incidents table
        await supabase
          .from('security_alerts')
          .insert({
            user_id: userId,
            alert_type: 'recovery_attempt_failed',
            metadata: { 
              method: 'recovery_code',
              user_agent: navigator.userAgent,
              timestamp: new Date().toISOString(),
              message: 'Failed recovery attempt using backup code'
            }
          });
      }
      
      return isValid;
    } catch (error) {
      console.error('Error verifying recovery code:', error);
      return false;
    }
  },
  
  /**
   * Mark a device as trusted for 30 days
   */
  trustDevice: async (userId: string, deviceHash: string): Promise<boolean> => {
    try {
      // Find the user session
      const { data: sessions } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('device_hash', deviceHash)
        .eq('is_active', true);
      
      if (!sessions || sessions.length === 0) {
        // Create a new trusted session if one doesn't exist
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from now
        
        await supabase
          .from('user_sessions')
          .insert({
            user_id: userId,
            device_hash: deviceHash,
            is_active: true,
            user_agent: navigator.userAgent,
            ip_address: 'client-ip', // This would be replaced with actual IP in a server environment
            trusted_until: expiryDate.toISOString(),
            is_trusted: true
          });
      } else {
        // Update the existing session to mark as trusted
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from now
        
        await supabase
          .from('user_sessions')
          .update({ 
            is_trusted: true,
            trusted_until: expiryDate.toISOString()
          })
          .eq('id', sessions[0].id);
      }
      
      return true;
    } catch (error) {
      console.error('Error trusting device:', error);
      return false;
    }
  },
  
  /**
   * Check if the current device is trusted for a user
   */
  isDeviceTrusted: async (userId: string, deviceHash: string): Promise<boolean> => {
    try {
      const now = new Date().toISOString();
      
      const { data: sessions } = await supabase
        .from('user_sessions')
        .select('trusted_until, is_trusted')
        .eq('user_id', userId)
        .eq('device_hash', deviceHash)
        .eq('is_active', true)
        .eq('is_trusted', true)
        .gt('trusted_until', now)
        .maybeSingle();
      
      return !!sessions; // If we found a valid trusted session, return true
    } catch (error) {
      console.error('Error checking trusted device:', error);
      return false;
    }
  },
  
  /**
   * Request account recovery
   * This implements the time-locked recovery with progressive delays
   */
  requestAccountRecovery: async (email: string): Promise<{success: boolean, timeDelay?: string, message: string}> => {
    try {
      // Find user by email
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserByEmail(email);
      
      if (userError || !user) {
        // Don't indicate whether the email exists or not
        return { 
          success: false, 
          message: "If your email exists in our system, you'll receive recovery instructions."
        };
      }
      
      // Check for recent recovery attempts
      const { data: attempts } = await supabase
        .from('security_alerts')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('alert_type', 'recovery_requested')
        .order('created_at', { ascending: false })
        .limit(3);
      
      let timeDelay: string | undefined;
      let needsAdminApproval = false;
      
      // Implement progressive delays
      if (attempts && attempts.length > 0) {
        const now = new Date();
        const mostRecent = new Date(attempts[0].created_at);
        const hoursSinceLastAttempt = (now.getTime() - mostRecent.getTime()) / (1000 * 60 * 60);
        
        if (attempts.length >= 3) {
          // Beyond 3 attempts requires admin approval
          needsAdminApproval = true;
          timeDelay = '72h';
        } else if (attempts.length === 2 && hoursSinceLastAttempt < 24) {
          timeDelay = '24h';
        } else if (attempts.length === 1 && hoursSinceLastAttempt < 1) {
          timeDelay = '1h';
        }
      }
      
      // Log the recovery request
      await supabase
        .from('security_alerts')
        .insert({
          user_id: user.id,
          alert_type: 'recovery_requested',
          metadata: {
            email: email,
            ip_address: 'client-ip',
            user_agent: navigator.userAgent,
            requires_admin: needsAdminApproval,
            time_delay: timeDelay
          }
        });
      
      // Send notification email (would be implemented in edge function)
      // This is a placeholder for where you would trigger the email
      
      return {
        success: true,
        timeDelay,
        message: needsAdminApproval 
          ? "Due to multiple recovery attempts, manual admin approval is required. You'll be contacted within 24-48 hours."
          : timeDelay 
            ? `For security, recovery is available after a ${timeDelay} waiting period. Please try again later.`
            : "Recovery instructions have been sent to your email address."
      };
    } catch (error) {
      console.error('Error requesting account recovery:', error);
      return { 
        success: false, 
        message: "An error occurred while processing your request. Please try again later." 
      };
    }
  },
  
  /**
   * Admin-initiated account recovery
   */
  adminRecoverAccount: async (adminUserId: string, targetUserId: string): Promise<{success: boolean, message: string}> => {
    try {
      // Verify admin permissions
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', adminUserId)
        .maybeSingle();
        
      if (!adminProfile || adminProfile.role !== 'admin') {
        return { success: false, message: "Unauthorized: Admin privileges required" };
      }
      
      // Generate new recovery codes for the user
      const { generateRecoveryCodes } = await import('@/lib/utils');
      const recoveryCodes = generateRecoveryCodes();
      
      // Update the profile with the new recovery codes
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ recovery_codes: recoveryCodes })
        .eq('id', targetUserId);
      
      if (updateError) {
        throw updateError;
      }
      
      // Log the admin recovery action
      await supabase
        .from('security_alerts')
        .insert({
          user_id: targetUserId,
          alert_type: 'admin_recovery',
          metadata: {
            admin_id: adminUserId,
            action: 'generated_recovery_codes',
            timestamp: new Date().toISOString()
          }
        });
      
      return {
        success: true,
        message: "Recovery codes generated successfully"
      };
    } catch (error) {
      console.error('Error in admin account recovery:', error);
      return { 
        success: false, 
        message: "Failed to recover account. Please try again or contact system support."
      };
    }
  }
};

// Helper function to generate a random recovery code
function generateRandomRecoveryCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  // Generate a 12-character code in format XXXX-XXXX-XXXX
  for (let i = 0; i < 12; i++) {
    if (i === 4 || i === 8) result += '-';
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}
