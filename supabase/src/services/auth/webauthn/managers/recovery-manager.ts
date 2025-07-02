
import { supabase } from '@/lib/supabase';

class RecoveryManager {
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

export const recoveryManager = new RecoveryManager();
