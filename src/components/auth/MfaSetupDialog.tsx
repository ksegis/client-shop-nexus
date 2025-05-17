
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
import { Loader2 } from 'lucide-react';

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
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [temporaryCode, setTemporaryCode] = useState('');
  
  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setStep('setup');
      setIsLoading(false);
      setVerificationCode('');
      
      // Generate a new MFA secret
      const { secret, temporaryCode } = mfaService.generateSecret(userEmail);
      setSecret(secret);
      setTemporaryCode(temporaryCode);
    }
  }, [open, userEmail]);

  const handleVerify = async () => {
    setIsLoading(true);
    
    // In our simplified implementation, compare directly with the temporary code
    const isValid = verificationCode === temporaryCode;
    
    if (isValid) {
      try {
        const success = await mfaService.enableForUser(userId, secret);
        
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
      }
    } else {
      toast({
        title: "Invalid Code",
        description: "The verification code you entered is incorrect.",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
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
                  "Enable Two-Factor Authentication"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
