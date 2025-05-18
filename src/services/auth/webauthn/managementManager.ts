
// Let's update the ManagementManager to fix the type issues

import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

// Define a proper interface for trusted devices
interface TrustedDevice {
  id?: string;
  user_id?: string;
  device_hash: string;
  created_at?: string;
  last_active?: string;
  ip_address?: string;
  user_agent?: string;
  is_active?: boolean;
  trusted_until?: string;
}

class ManagementManager {
  /**
   * Request account recovery for a user
   * @param email User's email address
   * @returns Result object with success status and message
   */
  async requestAccountRecovery(email: string): Promise<{ 
    success: boolean; 
    message: string;
    timeDelay?: string;
  }> {
    try {
      // Implement account recovery request logic
      // This would typically send an email with recovery instructions
      // For this example, we'll just return a success message
      return {
        success: true,
        message: "Recovery instructions have been sent to your email."
      };
    } catch (error) {
      console.error('Error requesting account recovery:', error);
      return {
        success: false,
        message: "An error occurred. Please try again later."
      };
    }
  }

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
  
  /**
   * Verify if a recovery code is valid for a user
   * @param userId User ID
   * @param recoveryCode Recovery code to verify
   * @returns true if the code is valid
   */
  async verifyRecoveryCode(userId: string, recoveryCode: string): Promise<boolean> {
    try {
      // Get user profile to check recovery codes
      const { data, error } = await supabase
        .from('profiles')
        .select('recovery_codes')
        .eq('id', userId)
        .single();
        
      if (error || !data) {
        console.error('Error fetching recovery codes:', error);
        return false;
      }
      
      // Check if recovery codes exist
      const recoveryCodes = data.recovery_codes || [];
      
      // Check if the provided code is in the list
      const isValidCode = recoveryCodes.includes(recoveryCode);
      
      if (isValidCode) {
        // Remove the used code and update the profile
        const updatedCodes = recoveryCodes.filter(code => code !== recoveryCode);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ recovery_codes: updatedCodes })
          .eq('id', userId);
        
        if (updateError) {
          console.error('Error updating recovery codes:', updateError);
          return false;
        }
        
        // Log the recovery code usage
        await this.logSecurityAlert(userId, 'recovery_code_used');
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error verifying recovery code:', error);
      return false;
    }
  }
  
  /**
   * Generate new recovery codes for a user
   * @param userId User ID
   * @returns Array of new recovery codes
   */
  async generateRecoveryCodes(userId: string): Promise<string[]> {
    try {
      // Generate 8 random recovery codes
      const codes = Array(8).fill(0).map(() => this.generateRandomCode());
      
      // Update the user's profile with the new codes
      const { error } = await supabase
        .from('profiles')
        .update({ recovery_codes: codes })
        .eq('id', userId);
        
      if (error) {
        console.error('Error updating recovery codes:', error);
        return [];
      }
      
      return codes;
    } catch (error) {
      console.error('Error generating recovery codes:', error);
      return [];
    }
  }
  
  /**
   * Log a security alert for a user
   * @param userId User ID
   * @param alertType Type of alert
   * @param metadata Additional metadata
   * @returns 
   */
  async logSecurityAlert(userId: string, alertType: string, metadata: Record<string, any> = {}) {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .insert({
          user_id: userId,
          alert_type: alertType,
          metadata
        });
        
      return !error;
    } catch (error) {
      console.error('Error logging security alert:', error);
      return false;
    }
  }
  
  /**
   * Trust a device for a user
   * @param userId User ID or email
   * @param deviceHash Device hash to trust
   * @returns 
   */
  async trustDevice(userId: string, deviceHash: string) {
    try {
      // Calculate expiration date (30 days from now)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      
      // If userId is an email, get the actual user ID
      let actualUserId = userId;
      if (userId.includes('@')) {
        // Since getUserByEmail doesn't exist, we'll use a different approach
        const { data: userData, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', userId)
          .single();
          
        if (userData) {
          actualUserId = userData.id;
        } else {
          console.error('User not found with email:', userId);
          return false;
        }
      }
      
      // Check if there's already a record for this device
      const { data: existingDevice } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', actualUserId)
        .eq('device_hash', deviceHash)
        .single();
        
      if (existingDevice) {
        // Update the existing device
        const { error } = await supabase
          .from('user_sessions')
          .update({
            is_active: true,
            last_active: new Date().toISOString(),
            trusted_until: expirationDate.toISOString()
          })
          .eq('id', existingDevice.id);
          
        return !error;
      } else {
        // Create a new trusted device record
        const { error } = await supabase
          .from('user_sessions')
          .insert({
            user_id: actualUserId,
            device_hash: deviceHash,
            is_active: true,
            user_agent: navigator.userAgent,
            trusted_until: expirationDate.toISOString()
          });
          
        return !error;
      }
    } catch (error) {
      console.error('Error trusting device:', error);
      return false;
    }
  }
  
  /**
   * Check if a device is trusted for a user
   * @param userId User ID
   * @param deviceHash Device hash to check
   * @returns 
   */
  async isDeviceTrusted(userId: string, deviceHash: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('device_hash', deviceHash)
        .eq('is_active', true)
        .single();
        
      if (error || !data) {
        return false;
      }
      
      // Check if trust has expired - using safe property access with type assertion
      const deviceData = data as TrustedDevice;
      if (deviceData.trusted_until) {
        const trustExpiration = new Date(deviceData.trusted_until);
        if (trustExpiration < new Date()) {
          // Trust has expired
          return false;
        }
      } else {
        // No expiration date means it's not trusted
        return false;
      }
      
      // Update last active time
      await supabase
        .from('user_sessions')
        .update({ last_active: new Date().toISOString() })
        .eq('id', data.id);
        
      return true;
    } catch (error) {
      console.error('Error checking trusted device:', error);
      return false;
    }
  }
  
  /**
   * Generate a random recovery code
   * @returns A random 12-character alphanumeric code
   */
  private generateRandomCode(): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    const segmentCount = 3;
    const segmentLength = 4;
    
    for (let segment = 0; segment < segmentCount; segment++) {
      for (let i = 0; i < segmentLength; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      if (segment < segmentCount - 1) {
        result += '-';
      }
    }
    
    return result;
  }
}

export const managementManager = new ManagementManager();
