
import { supabase } from '@/integrations/supabase/client';
import { arrayBufferToBase64, base64ToArrayBuffer } from './utils';
import type { AuthenticateParams } from './types';

/**
 * Handles WebAuthn authentication
 */
export const authenticateManager = {
  /**
   * Authenticate using a WebAuthn credential
   */
  authenticate: async ({ userId }: AuthenticateParams = {}): Promise<boolean> => {
    try {
      // Call our edge function to get authentication options
      const { data: authData, error: optionsError } = await supabase.functions.invoke('webauthn-authentication-options', {
        body: { user_id: userId }
      });
      
      if (optionsError || !authData) {
        console.error('Error getting authentication options:', optionsError || 'No data returned');
        return false;
      }
      
      // Convert base64 challenge to ArrayBuffer for the authenticator
      const publicKeyOptions = {
        ...authData.options,
        challenge: base64ToArrayBuffer(authData.options.challenge),
        allowCredentials: authData.options.allowCredentials?.map(cred => ({
          ...cred,
          id: base64ToArrayBuffer(cred.id),
        })),
      };
      
      // Request the credential from the user's authenticator
      const credential = await navigator.credentials.get({
        publicKey: publicKeyOptions
      }) as PublicKeyCredential;
      
      if (!credential) throw new Error("No credential returned");
      
      // Get assertion and client data from the credential
      const response = credential.response as AuthenticatorAssertionResponse;
      
      // Prepare assertion object for verification
      const assertion = {
        id: credential.id,
        rawId: arrayBufferToBase64(credential.rawId),
        response: {
          clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
          authenticatorData: arrayBufferToBase64(response.authenticatorData),
          signature: arrayBufferToBase64(response.signature),
          userHandle: response.userHandle ? arrayBufferToBase64(response.userHandle) : null,
        },
        type: credential.type
      };
      
      // Call our verification endpoint
      const { data: verificationData, error: verificationError } = await supabase.functions.invoke('webauthn-authentication-verification', {
        body: { 
          userId,
          assertion,
          challengeId: authData.challengeId
        }
      });
      
      if (verificationError || !verificationData?.verified) {
        console.error('Error verifying assertion:', verificationError || 'Verification failed');
        return false;
      }
      
      // Update last used timestamp (done in the edge function)
      
      return true;
    } catch (error) {
      console.error('Error authenticating with WebAuthn:', error);
      return false;
    }
  }
};
