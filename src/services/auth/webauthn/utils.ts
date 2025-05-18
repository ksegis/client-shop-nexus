
/**
 * WebAuthn utility functions for encoding/decoding
 */

// Base64 encoding/decoding utils
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = window.atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

/**
 * Check if WebAuthn is supported in this browser
 */
export const isWebAuthnSupported = (): boolean => {
  return window && 
         !!window.navigator.credentials && 
         !!window.PublicKeyCredential;
};

/**
 * Check if the browser supports WebAuthn autofill (passkeys)
 */
export const supportsAutofill = async (): Promise<boolean> => {
  if (!isWebAuthnSupported()) return false;
  
  return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
};
