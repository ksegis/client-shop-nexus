
import { supabase } from '@/lib/supabase';
import { arrayBufferToBase64, base64ToArrayBuffer } from './utils';
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
      
      // Convert base64 challenge to ArrayBuffer for the authenticator
      const publicKeyOptions = {
        ...registrationData.options,
        challenge: base64ToArrayBuffer(registrationData.options.challenge),
        user: {
          ...registrationData.options.user,
          id: base64ToArrayBuffer(registrationData.options.user.id),
        },
        excludeCredentials: registrationData.options.excludeCredentials?.map(cred => ({
          ...cred,
          id: base64ToArrayBuffer(cred.id),
        })),
      };
      
      // Create the credential using the options from our edge function
      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions
      }) as PublicKeyCredential;
      
      if (!credential) throw new Error("Failed to create credential");
      
      // Get attestation and client data from the credential
      const response = credential.response as AuthenticatorAttestationResponse;
      
      // Prepare attestation object for verification
      const attestation = {
        id: credential.id,
        rawId: arrayBufferToBase64(credential.rawId),
        response: {
          clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
          attestationObject: arrayBufferToBase64(response.attestationObject),
        },
        type: credential.type,
      };
      
      // Call our verification endpoint
      const { data: verificationData, error: verificationError } = await supabase.functions.invoke('webauthn-registration-verification', {
        body: { 
          userId, 
          attestation, 
          challengeId: registrationData.challengeId,
          deviceName
        }
      });
      
      if (verificationError || !verificationData?.verified) {
        console.error('Error verifying credential:', verificationError || 'Verification failed');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error registering WebAuthn credential:', error);
      return false;
    }
  }
};
