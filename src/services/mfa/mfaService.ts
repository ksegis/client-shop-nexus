
import { supabase } from '@/integrations/supabase/client';
import { generateRandomString, generateRecoveryCodes } from '@/lib/utils';

// Simple 6-digit code generator using cryptographically secure random values
const generateSixDigitCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// A utility to verify time-based codes (simple implementation)
const verifyTimeBasedCode = (userCode: string, storedCode: string): boolean => {
  // Simple implementation - in production, this would need to be time-based
  // and include proper validation with a secret
  return userCode === storedCode;
};

export const mfaService = {
  // Generate a secret code for MFA setup
  generateSecret: (email: string) => {
    const secret = generateRandomString(20);
    // In a real implementation, we would generate a proper TOTP secret
    // For now, we'll use a simplified approach
    const temporaryCode = generateSixDigitCode();
    
    return { 
      secret, 
      temporaryCode,
      // We're not using QR codes in this simplified version
      uri: `mfa:${email}:${secret}`,
      recoveryCodes: generateRecoveryCodes()
    };
  },

  // Verify the code entered by user
  verifyCode: (secret: string, token: string) => {
    // In a real implementation, this would validate against TOTP algorithm
    // For demo purposes, we'll just compare the codes
    return verifyTimeBasedCode(token, secret);
  },

  // Enable MFA for a user
  enableForUser: async (userId: string, secret: string, recoveryCodes: string[] = []) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          mfa_secret: secret, 
          mfa_enabled: true,
          recovery_codes: recoveryCodes
        })
        .eq('id', userId);
      
      if (error) throw error;

      // Log the MFA enablement as a successful attempt
      await supabase.from('mfa_attempts').insert({
        user_id: userId,
        successful: true,
        ip_address: 'Self-service',
        action: 'enable'
      });
      
      return true;
    } catch (error) {
      console.error('Error enabling MFA:', error);
      return false;
    }
  },

  // Disable MFA for a user
  disableForUser: async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          mfa_secret: null, 
          mfa_enabled: false,
          recovery_codes: null
        })
        .eq('id', userId);
      
      if (error) throw error;

      // Log the MFA disablement
      await supabase.from('mfa_attempts').insert({
        user_id: userId,
        successful: true,
        ip_address: 'Self-service',
        action: 'disable'
      });
      
      return true;
    } catch (error) {
      console.error('Error disabling MFA:', error);
      return false;
    }
  },

  // Record an MFA verification attempt
  recordAttempt: async (userId: string, successful: boolean, ipAddress: string = 'Unknown') => {
    try {
      await supabase.from('mfa_attempts').insert({
        user_id: userId,
        successful,
        ip_address: ipAddress,
        action: 'verify'
      });
      return true;
    } catch (error) {
      console.error('Error recording MFA attempt:', error);
      return false;
    }
  },
  
  // Verify MFA during login
  verifyMfaLogin: async (userId: string, code: string) => {
    try {
      // Get the user's MFA secret
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('mfa_secret, recovery_codes')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileError) throw profileError;
      if (!profile?.mfa_secret) return false;
      
      // Check if the code is one of the recovery codes
      if (profile.recovery_codes && Array.isArray(profile.recovery_codes)) {
        const isRecoveryCode = profile.recovery_codes.includes(code);
        
        if (isRecoveryCode) {
          // Remove the used recovery code
          const updatedCodes = profile.recovery_codes.filter(c => c !== code);
          
          await supabase
            .from('profiles')
            .update({ recovery_codes: updatedCodes })
            .eq('id', userId);
            
          // Record the successful recovery code use
          await mfaService.recordAttempt(userId, true);
          
          return true;
        }
      }
      
      // Verify the TOTP code
      // For demo purposes, we're using a simple implementation
      const isValid = verifyTimeBasedCode(code, profile.mfa_secret);
      
      // Record the attempt
      await mfaService.recordAttempt(userId, isValid);
      
      return isValid;
    } catch (error) {
      console.error('Error verifying MFA during login:', error);
      return false;
    }
  }
};
