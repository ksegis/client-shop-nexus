
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { webAuthnService } from '@/services/auth/webauthn';
import { Loader2, KeyRound, Shield, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [activeTab, setActiveTab] = useState<'code' | 'recovery' | 'securityKey'>('code');
  const [isWebAuthnSupported] = useState(webAuthnService.isSupported());

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
      if (!success) {
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
      if (!success) {
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
        await onVerify('webauthn-verification');
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
              setActiveTab(value as 'code' | 'recovery' | 'securityKey');
              setError(null);
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="code">App Code</TabsTrigger>
              {isWebAuthnSupported && (
                <TabsTrigger value="securityKey">Security Key</TabsTrigger>
              )}
              <TabsTrigger value="recovery">Recovery Code</TabsTrigger>
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
          </Tabs>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col text-xs text-muted-foreground">
        <p>If you're having trouble, contact support.</p>
      </CardFooter>
    </Card>
  );
};
