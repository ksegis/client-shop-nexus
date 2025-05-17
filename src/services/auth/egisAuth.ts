
import { supabase } from '@/integrations/supabase/client';
import { config } from '@/config';

/**
 * Service to handle EGIS OAuth authentication
 */
export const egisAuth = {
  /**
   * Initiates the EGIS OAuth flow
   * @param redirectPath Optional path to redirect to after successful authentication
   * @returns The generated state for CSRF protection
   */
  initiateAuth: (redirectPath?: string) => {
    // Generate a random state for CSRF protection
    const state = crypto.randomUUID();
    
    // Store the state and redirect path in localStorage for verification later
    localStorage.setItem('egis_auth_state', state);
    if (redirectPath) {
      localStorage.setItem('egis_auth_redirect', redirectPath);
    }
    
    return state;
  },
  
  /**
   * Handles the OAuth callback from EGIS
   * @param code The authorization code from EGIS
   * @param state The state parameter for CSRF protection
   */
  handleCallback: async (code: string, state: string) => {
    // Verify state matches what we sent (CSRF protection)
    const savedState = localStorage.getItem('egis_auth_state');
    if (!savedState || savedState !== state) {
      throw new Error('Invalid state parameter');
    }
    
    // Clear the state from localStorage
    localStorage.removeItem('egis_auth_state');
    
    // Exchange the code for tokens
    const { clientId, clientSecret, tokenUrl, redirectUri } = config.egis;
    
    if (!clientId || !tokenUrl || !redirectUri) {
      throw new Error('EGIS configuration is incomplete');
    }
    
    // Create form data for token request
    const formData = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri
    });
    
    // Exchange code for tokens
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Token exchange failed: ${errorData.error || response.statusText}`);
    }
    
    const tokenData = await response.json();
    
    // Use the ID token for Supabase sign-in (if using Supabase with OIDC)
    if (tokenData.id_token) {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'egis',
        token: tokenData.id_token
      });
      
      if (error) {
        throw error;
      }
      
      return data;
    }
    
    // Alternative: Store the tokens directly if not using Supabase's OIDC
    localStorage.setItem('egis_access_token', tokenData.access_token);
    
    // Get the redirect path if it was stored
    const redirectPath = localStorage.getItem('egis_auth_redirect');
    if (redirectPath) {
      localStorage.removeItem('egis_auth_redirect');
      return { redirectPath };
    }
    
    return tokenData;
  }
};
