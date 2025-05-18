
import { isWebAuthnSupported, supportsAutofill } from './utils';
import { authenticateManager } from './authenticateManager';
import { registrationManager } from './registrationManager';
import { managementManager } from './managementManager';
import type { RegisteredAuthenticator, WebAuthnOptions, AuthenticationResult } from './types';

// Export the main WebAuthn service
export const webAuthnService = {
  // Check if WebAuthn is supported in this browser
  isSupported: isWebAuthnSupported,

  // Check if the browser supports WebAuthn autofill (passkeys)
  supportsAutofill,
  
  // Register a new WebAuthn credential (security key or passkey)
  registerCredential: async (userId: string, deviceName: string, options?: WebAuthnOptions): Promise<boolean> => {
    return registrationManager.registerCredential({ userId, deviceName, options });
  },
  
  // Authenticate using a WebAuthn credential
  authenticate: async (userId?: string, options?: WebAuthnOptions): Promise<boolean> => {
    return authenticateManager.authenticate({ userId, options });
  },
  
  // Get all registered authenticators for a user
  getUserAuthenticators: managementManager.getUserAuthenticators,
  
  // Delete a registered authenticator
  deleteAuthenticator: managementManager.deleteAuthenticator
};

export type { RegisteredAuthenticator, WebAuthnOptions, AuthenticationResult };
