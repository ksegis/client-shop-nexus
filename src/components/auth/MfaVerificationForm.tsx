
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { webAuthnService } from '@/services/auth/webauthn';
import { Loader2, KeyRound } from 'lucide-react';

interface MfaVerificationFormProps {
  email: string;
  onVerify: (code: string) => Promise<boolean>;
  onCancel: () => void;
}

export const MfaVerificationForm = ({ email, onVerify, onCancel }: MfaVerificationFormProps) => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWebAuthnSubmitting, setIsWebAuthnSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
              
              {error && (
                <div className="text-destructive text-sm mt-2">
                  {error}
                </div>
              )}
            </div>
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                type="button" 
                onClick={onCancel}
                disabled={isSubmitting || isWebAuthnSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={code.length !== 6 || isSubmitting || isWebAuthnSubmitting}
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
          
          {isWebAuthnSupported && (
            <div className="pt-4 border-t">
              <Button
                variant="secondary"
                type="button"
                className="w-full"
                onClick={handleWebAuthnAuth}
                disabled={isSubmitting || isWebAuthnSubmitting}
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
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col text-xs text-muted-foreground">
        <p>If you're having trouble, contact support.</p>
      </CardFooter>
    </Card>
  );
};
