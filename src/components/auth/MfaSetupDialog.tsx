
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  InputOTP, 
  InputOTPGroup, 
  InputOTPSlot 
} from '@/components/ui/input-otp';
import { mfaService } from '@/services/mfa/mfaService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MfaSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
  onComplete?: () => void;
}

export function MfaSetupDialog({
  open,
  onOpenChange,
  userId,
  userEmail,
  onComplete
}: MfaSetupDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'setup' | 'verify' | 'recoveryCodes'>('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [temporaryCode, setTemporaryCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);
  
  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setStep('setup');
      setIsLoading(false);
      setVerificationCode('');
      setCopiedCodes(false);
      
      // Generate a new MFA secret and recovery codes
      const { secret, temporaryCode, recoveryCodes } = mfaService.generateSecret(userEmail);
      setSecret(secret);
      setTemporaryCode(temporaryCode);
      setRecoveryCodes(recoveryCodes);
    }
  }, [open, userEmail]);

  const handleVerify = async () => {
    setIsLoading(true);
    
    // In our simplified implementation, compare directly with the temporary code
    const isValid = verificationCode === temporaryCode;
    
    if (isValid) {
      setStep('recoveryCodes');
      setIsLoading(false);
    } else {
      toast({
        title: "Invalid Code",
        description: "The verification code you entered is incorrect.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };
  
  const handleComplete = async () => {
    setIsLoading(true);
    
    try {
      const success = await mfaService.enableForUser(userId, secret, recoveryCodes);
      
      if (success) {
        toast({
          title: "MFA Enabled",
          description: "Two-factor authentication has been enabled for your account."
        });
        onComplete?.();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to enable two-factor authentication.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error enabling MFA:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while enabling MFA.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setCopiedCodes(true);
    toast({
      title: "Copied",
      description: "Recovery codes copied to clipboard",
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            Protect your account with an additional layer of security.
          </DialogDescription>
        </DialogHeader>
        
        {step === 'setup' && (
          <div className="space-y-4 py-4">
            <Alert>
              <AlertDescription>
                For demonstration purposes, we're using a simplified code-based approach. 
                Your verification code is: <strong>{temporaryCode}</strong>
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={() => setStep('verify')}
              className="w-full"
            >
              Continue to Verification
            </Button>
          </div>
        )}
        
        {step === 'verify' && (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center space-y-2">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code to verify and enable two-factor authentication
                </p>
              </div>
              
              <InputOTP
                maxLength={6}
                value={verificationCode}
                onChange={setVerificationCode}
                render={({ slots }) => (
                  <InputOTPGroup>
                    {slots.map((slot, index) => (
                      <InputOTPSlot key={index} {...slot} index={index} />
                    ))}
                  </InputOTPGroup>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep('setup')}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                onClick={handleVerify}
                disabled={verificationCode.length !== 6 || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
        
        {step === 'recoveryCodes' && (
          <div className="space-y-4 py-4">
            <Alert className="bg-amber-50">
              <AlertDescription className="text-amber-900">
                <div className="font-bold mb-2">Save these recovery codes</div>
                <p className="mb-2 text-sm">
                  If you lose access to your authenticator app, you can use these codes to sign in. 
                  Each code can only be used once.
                </p>
              </AlertDescription>
            </Alert>
            
            <div className="bg-muted rounded-md p-3">
              <div className="grid grid-cols-2 gap-2">
                {recoveryCodes.map((code, i) => (
                  <div key={i} className="font-mono text-sm p-1">{code}</div>
                ))}
              </div>
              <div className="mt-2 flex justify-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={copyRecoveryCodes}
                >
                  {copiedCodes ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy codes
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <DialogFooter className="flex flex-col space-y-2 sm:space-y-0 pt-4">
              <div className="flex w-full justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep('verify')}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={isLoading || !copiedCodes}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enabling...
                    </>
                  ) : (
                    "Enable Two-Factor Authentication"
                  )}
                </Button>
              </div>
              {!copiedCodes && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  Please copy your recovery codes before continuing
                </p>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
