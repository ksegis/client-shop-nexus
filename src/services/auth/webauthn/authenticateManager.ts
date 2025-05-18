
import { supabase } from '@/integrations/supabase/client';
import { arrayBufferToBase64, base64ToArrayBuffer } from './utils';

/**
 * Handles WebAuthn authentication
 */
export const authenticateManager = {
  /**
   * Authenticate using a WebAuthn credential
   */
  authenticate: async (userId?: string): Promise<boolean> => {
    try {
      // Get user's registered credentials
      let credentials: Array<{credential_id: string}> = [];
      
      if (userId) {
        const { data, error } = await supabase
          .from('user_authenticators')
          .select('credential_id')
          .eq('user_id', userId);
          
        if (error) throw error;
        credentials = data || [];
      }
      
      // Create a challenge for this authentication
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      
      // Save this challenge - using RPC to handle the new table
      if (userId) {
        const { error: challengeError } = await supabase.functions.invoke('store_webauthn_challenge', {
          body: { 
            p_user_id: userId,
            p_challenge: arrayBufferToBase64(challenge),
            p_type: 'authentication',
            p_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes expiry
          }
        });
          
        if (challengeError) throw challengeError;
      }
      
      // Create PublicKey credential request options
      const publicKeyOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        timeout: 60000,
        userVerification: 'preferred',
        // Include allowCredentials only if we have specific credentials
        ...(credentials.length > 0 && {
          allowCredentials: credentials.map(cred => ({
            id: base64ToArrayBuffer(cred.credential_id),
            type: 'public-key'
          }))
        })
      };
      
      // Request the credential
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyOptions
      }) as PublicKeyCredential;
      
      if (!assertion) throw new Error("No assertion returned");
      
      // Extract credential ID and user ID
      const credentialId = arrayBufferToBase64(assertion.rawId);
      
      // Find the credential in our database
      const { data, error } = await supabase
        .from('user_authenticators')
        .select('user_id')
        .eq('credential_id', credentialId)
        .single();
      
      if (error) throw error;
      
      if (!data?.user_id) {
        throw new Error("Invalid credential");
      }
      
      // Update the last_used_at timestamp
      await supabase
        .from('user_authenticators')
        .update({ last_used_at: new Date().toISOString() })
        .eq('credential_id', credentialId);
      
      // If we get here, authentication was successful
      return true;
    } catch (error) {
      console.error('Error authenticating with WebAuthn:', error);
      return false;
    }
  }
};
