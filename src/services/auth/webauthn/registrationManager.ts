
import { supabase } from '@/integrations/supabase/client';
import { arrayBufferToBase64 } from './utils';
import type { RegisterCredentialParams } from './types';

/**
 * Handles WebAuthn credential registration
 */
export const registrationManager = {
  /**
   * Register a new WebAuthn credential (security key or passkey)
   */
  registerCredential: async (
    { userId, deviceName, options = {} }: RegisterCredentialParams
  ): Promise<boolean> => {
    try {
      // Call our edge function to get registration options
      const { data: registrationData, error: optionsError } = await supabase.functions.invoke('webauthn-registration-options', {
        body: { user_id: userId, device_name: deviceName }
      });
      
      if (optionsError || !registrationData) {
        console.error('Error getting registration options:', optionsError || 'No data returned');
        return false;
      }
      
      // Create the credential using the options from our edge function
      const credential = await navigator.credentials.create({
        publicKey: registrationData.options
      }) as PublicKeyCredential;
      
      if (!credential) throw new Error("Failed to create credential");
      
      // Get attestation and client data from the credential
      const response = credential.response as AuthenticatorAttestationResponse;
      
      // Store credential in database
      const { error } = await supabase.from('user_authenticators').insert({
        user_id: userId,
        credential_id: arrayBufferToBase64(credential.rawId),
        public_key: arrayBufferToBase64(response.getPublicKey() as ArrayBuffer),
        device_name: deviceName || 'Security Key'
      });
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error registering WebAuthn credential:', error);
      return false;
    }
  }
};
