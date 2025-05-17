
import { supabase } from '@/integrations/supabase/client';

// Base64 encoding/decoding utils
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = window.atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

export interface RegisteredAuthenticator {
  id: string;
  credential_id: string;
  device_name: string;
  created_at: string;
  last_used_at: string | null;
}

export const webAuthnService = {
  // Check if WebAuthn is supported in this browser
  isSupported: (): boolean => {
    return window && 
           !!window.navigator.credentials && 
           !!window.PublicKeyCredential;
  },

  // Check if the browser supports WebAuthn autofill (passkeys)
  supportsAutofill: async (): Promise<boolean> => {
    if (!webAuthnService.isSupported()) return false;
    
    return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  },
  
  // Register a new WebAuthn credential (security key or passkey)
  registerCredential: async (
    userId: string, 
    deviceName: string
  ): Promise<boolean> => {
    try {
      // Create a new challenge for this registration
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      
      // Save this challenge to verify later - using executeQuery with manual SQL to handle the new table
      const { error: challengeError } = await supabase.functions.invoke('store_webauthn_challenge', { 
        body: { 
          p_user_id: userId,
          p_challenge: arrayBufferToBase64(challenge),
          p_type: 'registration',
          p_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes expiry
        }
      });
        
      if (challengeError) throw challengeError;
      
      // Create PublicKey credential creation options
      const publicKeyOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'Auto Shop Management',
          // Use the current domain for the RP ID
          id: window.location.hostname
        },
        user: {
          id: Uint8Array.from(userId, c => c.charCodeAt(0)),
          name: userId,
          displayName: deviceName || 'Security Key'
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 } // RS256
        ],
        timeout: 60000,
        attestation: 'none',
        authenticatorSelection: {
          userVerification: 'preferred',
          residentKey: 'preferred',
          requireResidentKey: false
        }
      };
      
      // Create the credential
      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions
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
  },
  
  // Authenticate using a WebAuthn credential
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
  },
  
  // Get all registered authenticators for a user
  getUserAuthenticators: async (userId: string): Promise<RegisteredAuthenticator[]> => {
    try {
      const { data, error } = await supabase
        .from('user_authenticators')
        .select('id, credential_id, device_name, created_at, last_used_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching user authenticators:', error);
      return [];
    }
  },
  
  // Delete a registered authenticator
  deleteAuthenticator: async (authenticatorId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_authenticators')
        .delete()
        .eq('id', authenticatorId);
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error deleting authenticator:', error);
      return false;
    }
  }
};
