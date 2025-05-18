import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { webAuthnService } from '@/services/auth/webauthn';
import { managementManager } from '@/services/auth/webauthn/managementManager';
import { Loader2, KeyRound, Shield, AlertTriangle, LifeBuoy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AccountRecoveryForm } from './AccountRecoveryForm';

interface MfaVerificationFormProps {
  email: string;
  onVerify: (code: string) => Promise<boolean>;
  onCancel: () => void;
}

export const MfaVerificationForm = ({ email, onVerify, onCancel }: MfaVerificationFormProps) => {
  const [code, setCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWebAuthnSubmitting, setIsWebAuthnSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'recovery' | 'securityKey' | 'help'>('code');
  const [isWebAuthnSupported] = useState(webAuthnService.isSupported());
  const [showTrustDeviceOption, setShowTrustDeviceOption] = useState(false);
  const [trustThisDevice, setTrustThisDevice] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const success = await onVerify(code);
      if (success) {
        setVerificationSuccess(true);
        setShowTrustDeviceOption(true);
        
        // If user chose to trust this device
        if (trustThisDevice) {
          // Get the device fingerprint (in a real app, would use a proper device identifier)
          const deviceHash = await generateDeviceHash();
          
          // Mark this device as trusted for the user
          await managementManager.trustDevice(email, deviceHash);
        }
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during verification');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecoveryCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recoveryCode.trim()) {
      setError('Please enter a recovery code');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Send the recovery code to the same verification endpoint
      // with a special prefix to indicate it's a recovery code
      const success = await onVerify(`recovery:${recoveryCode.trim()}`);
      if (success) {
        setVerificationSuccess(true);
        setShowTrustDeviceOption(true);
        
        // If user chose to trust this device
        if (trustThisDevice) {
          // Get the device fingerprint
          const deviceHash = await generateDeviceHash();
          
          // Mark this device as trusted for the user
          await managementManager.trustDevice(email, deviceHash);
        }
      } else {
        setError('Invalid recovery code. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during verification');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWebAuthnAuth = async () => {
    setIsWebAuthnSubmitting(true);
    setError(null);
    
    try {
      const success = await webAuthnService.authenticate();
      
      if (success) {
        // If WebAuthn authentication is successful, we pass a special code to the parent component
        const verifySuccess = await onVerify('webauthn-verification');
        
        if (verifySuccess) {
          setVerificationSuccess(true);
          setShowTrustDeviceOption(true);
          
          // If user chose to trust this device
          if (trustThisDevice) {
            // Get the device fingerprint
            const deviceHash = await generateDeviceHash();
            
            // Mark this device as trusted for the user
            await managementManager.trustDevice(email, deviceHash);
          }
        } else {
          setError('Security key verification failed. Please try again.');
        }
      } else {
        setError('Security key verification failed. Please try again.');
      }
    } catch (err) {
      console.error('WebAuthn authentication error:', err);
      setError('An error occurred during security key verification');
    } finally {
      setIsWebAuthnSubmitting(false);
    }
  };

  // Generate a device hash for trusted device identification
  const generateDeviceHash = async (): Promise<string> => {
    // In a real implementation, you would use a library like FingerprintJS
    // For this example, we'll create a simple hash of user agent and other characteristics
    const fpPromise = import('@fingerprintjs/fingerprintjs').then(FingerprintJS => FingerprintJS.load());
    const fp = await fpPromise;
    const result = await fp.get();
    return result.visitorId;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter the verification code from your authenticator app or use your registered security key
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm">
            Verifying for <span className="font-medium">{email}</span>
          </div>
          
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => {
              setActiveTab(value as 'code' | 'recovery' | 'securityKey' | 'help');
              setError(null);
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="code">App Code</TabsTrigger>
              {isWebAuthnSupported && (
                <TabsTrigger value="securityKey">Security Key</TabsTrigger>
              )}
              <TabsTrigger value="recovery">Recovery Code</TabsTrigger>
              <TabsTrigger value="help">Need Help</TabsTrigger>
            </TabsList>
            
            <TabsContent value="code">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col items-center space-y-2">
                  <InputOTP
                    maxLength={6}
                    value={code}
                    onChange={setCode}
                    disabled={isSubmitting}
                    render={({ slots }) => (
                      <InputOTPGroup>
                        {slots.map((slot, index) => (
                          <InputOTPSlot key={index} index={index} {...slot} />
                        ))}
                      </InputOTPGroup>
                    )}
                  />
                </div>
                
                {error && activeTab === 'code' && (
                  <div className="text-destructive text-sm mt-2">
                    {error}
                  </div>
                )}
                
                {showTrustDeviceOption && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="trust-device"
                      checked={trustThisDevice}
                      onChange={(e) => setTrustThisDevice(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="trust-device" className="text-sm">
                      Trust this device for 30 days
                    </Label>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={code.length !== 6 || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify'
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            {isWebAuthnSupported && (
              <TabsContent value="securityKey">
                <div className="py-4 space-y-4">
                  <div className="flex justify-center py-4">
                    <KeyRound className="h-16 w-16 text-primary" />
                  </div>
                  
                  <p className="text-center text-sm text-muted-foreground">
                    Connect and tap your security key to authenticate
                  </p>
                  
                  {error && activeTab === 'securityKey' && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {showTrustDeviceOption && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="trust-device-webauthn"
                        checked={trustThisDevice}
                        onChange={(e) => setTrustThisDevice(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="trust-device-webauthn" className="text-sm">
                        Trust this device for 30 days
                      </Label>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={onCancel}
                      disabled={isWebAuthnSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleWebAuthnAuth}
                      disabled={isWebAuthnSubmitting}
                    >
                      {isWebAuthnSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <KeyRound className="mr-2 h-4 w-4" />
                          Use Security Key
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            )}
            
            <TabsContent value="recovery">
              <form onSubmit={handleRecoveryCodeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recovery-code">Enter recovery code</Label>
                  <Input
                    id="recovery-code"
                    placeholder="Enter your recovery code"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                
                {error && activeTab === 'recovery' && (
                  <div className="text-destructive text-sm mt-2">
                    {error}
                  </div>
                )}
                
                {showTrustDeviceOption && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="trust-device-recovery"
                      checked={trustThisDevice}
                      onChange={(e) => setTrustThisDevice(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="trust-device-recovery" className="text-sm">
                      Trust this device for 30 days
                    </Label>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={!recoveryCode.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Use Recovery Code'
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="help">
              <div className="py-4 space-y-4">
                <div className="flex justify-center py-4">
                  <LifeBuoy className="h-16 w-16 text-primary" />
                </div>
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <p>Can't access your account? Use the Account Recovery process.</p>
                    <p className="text-xs mt-1">Note: Recovery may take up to 24 hours for verification.</p>
                  </AlertDescription>
                </Alert>
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={onCancel}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('recovery')}
                  >
                    Use Recovery Code
                  </Button>
                </div>
                
                <div className="text-center mt-4">
                  <Button
                    variant="link"
                    className="text-xs"
                    onClick={() => window.location.href = '/account-recovery'}
                  >
                    Start Account Recovery Process
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col text-xs text-muted-foreground">
        <p>If you're having trouble, contact support.</p>
      </CardFooter>
    </Card>
  );
};
