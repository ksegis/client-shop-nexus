
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { webAuthnService } from '@/services/auth/webAuthnService';
import { Loader2, Key, Fingerprint } from 'lucide-react';

interface MfaVerificationFormProps {
  email: string;
  onVerify: (code: string) => Promise<boolean>;
  onCancel: () => void;
}

export function MfaVerificationForm({ email, onVerify, onCancel }: MfaVerificationFormProps) {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isWebAuthnSupported, setIsWebAuthnSupported] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if WebAuthn is supported
    setIsWebAuthnSupported(webAuthnService.isSupported());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      toast({
        title: "Verification code required",
        description: "Please enter your verification code",
        variant: "destructive"
      });
      return;
    }
    
    setIsVerifying(true);
    
    try {
      const success = await onVerify(code);
      
      if (!success) {
        toast({
          title: "Verification failed",
          description: "Invalid verification code. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleWebAuthnAuthentication = async () => {
    setIsAuthenticating(true);
    
    try {
      const success = await webAuthnService.authenticate();
      
      if (success) {
        // If WebAuthn succeeds, pass a special code to the verification handler
        const verifySuccess = await onVerify('webauthn-verification');
        
        if (!verifySuccess) {
          toast({
            title: "Verification failed",
            description: "Your security key was recognized, but additional verification is needed.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Authentication failed",
          description: "Security key verification failed. Please try again or use your verification code.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('WebAuthn authentication error:', error);
      toast({
        title: "Authentication error",
        description: "An error occurred during security key verification.",
        variant: "destructive"
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter the verification code to sign in as {email}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isWebAuthnSupported && (
          <>
            <div className="mb-4">
              <Button
                className="w-full"
                onClick={handleWebAuthnAuthentication}
                disabled={isAuthenticating}
              >
                {isAuthenticating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Key className="mr-2 h-4 w-4" />
                )}
                Sign in with Security Key
              </Button>
            </div>
            
            <div className="relative my-4">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-card px-2 text-xs text-muted-foreground">OR</span>
              </div>
            </div>
          </>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                placeholder="Enter 6-digit verification code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={6}
                disabled={isVerifying}
              />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isVerifying}>
          {isVerifying ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Fingerprint className="mr-2 h-4 w-4" />
          )}
          Verify
        </Button>
      </CardFooter>
    </Card>
  );
}
