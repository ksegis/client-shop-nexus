
/**
 * WebAuthn types
 */

export interface RegisteredAuthenticator {
  id: string;
  credential_id: string;
  device_name: string;
  created_at: string;
  last_used_at: string | null;
}

export interface WebAuthnOptions {
  rpName?: string;
}

export interface RegisterCredentialParams {
  userId: string;
  deviceName: string;
  options?: WebAuthnOptions;
}

export interface AuthenticateParams {
  userId?: string;
  options?: WebAuthnOptions;
}

export interface AuthenticationResult {
  verified: boolean;
  userId?: string;
}
