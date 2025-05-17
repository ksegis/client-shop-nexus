
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MfaVerificationForm } from '@/components/auth/MfaVerificationForm';
import { mfaService } from '@/services/mfa/mfaService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { webAuthnService } from '@/services/auth/webAuthnService';

const VerifyMFA = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  
  // Get session data from location state or sessionStorage
  useEffect(() => {
    const checkSession = async () => {
      // Try to get MFA session data from location state
      const state = location.state as { userId?: string, email?: string } | undefined;
      
      if (state?.userId && state?.email) {
        setUserId(state.userId);
        setEmail(state.email);
        setIsLoading(false);
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
            setIsLoading(false);
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
      } else {
        // Standard MFA code verification
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
