
import { supabase } from '@/lib/supabase';
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
      // Get client IP address for logging - in production this would come from a proper source
      // Here we're just using a placeholder
      const ipAddress = 'client-ip';
      const userAgent = navigator.userAgent;
      
      try {
        // Call our edge function to get authentication options
        const { data: authData, error: optionsError } = await supabase.functions.invoke('webauthn-authentication-options', {
          body: { user_id: userId }
        });
        
        if (optionsError || !authData) {
          console.error('Error getting authentication options:', optionsError || 'No data returned');
          
          // Log failed attempt
          await supabase.from('mfa_attempts').insert({
            user_id: userId,
            successful: false,
            ip_address: ipAddress,
            action: 'webauthn_auth_options_error',
            metadata: { user_agent: userAgent, error: optionsError?.message || 'No data returned' }
          });
          
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
        
        if (!credential) {
          // Log failed attempt - user cancelled or hardware error
          await supabase.from('mfa_attempts').insert({
            user_id: userId,
            successful: false,
            ip_address: ipAddress,
            action: 'webauthn_auth_cancelled',
            metadata: { user_agent: userAgent }
          });
          
          throw new Error("No credential returned");
        }
        
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
        
        // Log authentication result
        await supabase.from('mfa_attempts').insert({
          user_id: userId,
          successful: verificationData?.verified === true,
          ip_address: ipAddress,
          action: 'webauthn_auth',
          metadata: { 
            user_agent: userAgent,
            error: verificationError?.message || (verificationData?.verified ? null : 'Verification failed')
          }
        });
        
        if (verificationError || !verificationData?.verified) {
          console.error('Error verifying assertion:', verificationError || 'Verification failed');
          return false;
        }
        
        return true;
      } catch (error: any) {
        // Log any uncaught errors
        await supabase.from('mfa_attempts').insert({
          user_id: userId,
          successful: false,
          ip_address: ipAddress,
          action: 'webauthn_auth_error',
          metadata: { user_agent: userAgent, error: error.message || 'Unknown error' }
        });
        
        console.error('Error authenticating with WebAuthn:', error);
        return false;
      }
    } catch (finalError) {
      // This catch block handles errors that might occur in the logging itself
      console.error('Critical error in WebAuthn authentication:', finalError);
      return false;
    }
  }
};
