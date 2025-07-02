
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MfaVerificationForm } from '@/components/auth/MfaVerificationForm';
import { mfaService } from '@/services/mfa/mfaService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { webAuthnService } from '@/services/auth/webauthn';
import { managementManager } from '@/services/auth/webauthn/managementManager';

const VerifyMFA = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [isTrustedDevice, setIsTrustedDevice] = useState(false);
  
  // Get session data from location state or sessionStorage
  useEffect(() => {
    const checkSession = async () => {
      // Try to get MFA session data from location state
      const state = location.state as { userId?: string, email?: string } | undefined;
      
      if (state?.userId && state?.email) {
        setUserId(state.userId);
        setEmail(state.email);
        await checkTrustedDevice(state.userId);
        return;
      }
      
      // If not in state, check session storage
      const storedSession = sessionStorage.getItem('mfaSession');
      if (storedSession) {
        try {
          const { userId, email } = JSON.parse(storedSession);
          if (userId && email) {
            setUserId(userId);
            setEmail(email);
            await checkTrustedDevice(userId);
            return;
          }
        } catch (error) {
          console.error("Error parsing stored MFA session:", error);
        }
      }
      
      // If we don't have the required data, redirect to login
      toast({
        title: "Session Expired",
        description: "Your verification session has expired. Please log in again.",
        variant: "destructive"
      });
      navigate('/shop-login');
    };
    
    const checkTrustedDevice = async (userId: string) => {
      try {
        // Generate device fingerprint
        const fpPromise = import('@fingerprintjs/fingerprintjs').then(FingerprintJS => FingerprintJS.load());
        const fp = await fpPromise;
        const result = await fp.get();
        const deviceHash = result.visitorId;
        
        // Check if this device is trusted
        const trusted = await managementManager.isDeviceTrusted(userId, deviceHash);
        
        if (trusted) {
          setIsTrustedDevice(true);
          // Automatically bypass MFA for trusted devices
          handleVerify('trusted-device');
          return;
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking trusted device:", error);
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, [location, navigate, toast]);
  
  const handleVerify = async (code: string): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      let success = false;
      
      // Handle special WebAuthn verification
      if (code === 'webauthn-verification') {
        // For WebAuthn, we've already authenticated with the security key
        // Now we just need to check if this user has WebAuthn enabled
        const authenticators = await webAuthnService.getUserAuthenticators(userId);
        success = authenticators.length > 0;
      } 
      // Handle trusted device bypass
      else if (code === 'trusted-device') {
        success = true;
        
        // Log the MFA bypass due to trusted device
        await supabase
          .from('mfa_attempts')
          .insert({
            user_id: userId,
            successful: true,
            ip_address: 'client-ip',
            action: 'trusted_device_bypass',
            metadata: { user_agent: navigator.userAgent }
          });
      }
      // Handle recovery codes
      else if (code.startsWith('recovery:')) {
        const recoveryCode = code.replace('recovery:', '');
        success = await managementManager.verifyRecoveryCode(userId, recoveryCode);
      } 
      // Standard MFA code verification
      else {
        success = await mfaService.verifyMfaLogin(userId, code);
      }
      
      if (success) {
        // Remove the temporary session data
        sessionStorage.removeItem('mfaSession');
        
        toast({
          title: "Verification Successful",
          description: "You have been successfully authenticated"
        });
        
        // Redirection to appropriate page based on user role
        // This would typically check the user's role and redirect accordingly
        navigate('/profile');
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("MFA verification error:", error);
      return false;
    }
  };
  
  const handleCancel = async () => {
    // Sign out the user and redirect to login
    await supabase.auth.signOut();
    sessionStorage.removeItem('mfaSession');
    navigate('/shop-login');
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If it's a trusted device, show a loading screen while we automatically verify
  if (isTrustedDevice) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="text-lg font-medium">Verifying trusted device...</h3>
          <p className="text-sm text-muted-foreground mt-2">You'll be redirected automatically</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center p-4">
      <div className="mx-auto max-w-md w-full">
        <MfaVerificationForm
          email={email}
          onVerify={handleVerify}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default VerifyMFA;
