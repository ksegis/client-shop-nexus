
// Import the separate managers
import { authenticatorManager } from './managers/authenticator-manager';
import { recoveryManager } from './managers/recovery-manager';
import { deviceManager } from './managers/device-manager';
import { securityManager } from './managers/security-manager';

// Create a combined manager that exposes all functionality
class ManagementManager {
  // Re-export methods from authenticatorManager
  getUserAuthenticators = authenticatorManager.getUserAuthenticators;
  updateAuthenticatorName = authenticatorManager.updateAuthenticatorName;
  deleteAuthenticator = authenticatorManager.deleteAuthenticator;
  
  // Re-export methods from recoveryManager
  requestAccountRecovery = recoveryManager.requestAccountRecovery;
  verifyRecoveryCode = recoveryManager.verifyRecoveryCode;
  generateRecoveryCodes = recoveryManager.generateRecoveryCodes;
  
  // Re-export methods from deviceManager
  trustDevice = deviceManager.trustDevice;
  isDeviceTrusted = deviceManager.isDeviceTrusted;
  
  // Re-export methods from securityManager
  logSecurityAlert = securityManager.logSecurityAlert;
}

export const managementManager = new ManagementManager();
