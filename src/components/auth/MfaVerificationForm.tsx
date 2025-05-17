
import React, { useState } from 'react';
import { 
  InputOTP, 
  InputOTPGroup, 
  InputOTPSlot 
} from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MfaVerificationFormProps {
  email: string;
  onVerify: (code: string) => Promise<boolean>;
  onCancel: () => void;
}

export function MfaVerificationForm({ email, onVerify, onCancel }: MfaVerificationFormProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const handleVerify = async () => {
    if (code.length !== 6) return;
    
    setIsLoading(true);
    try {
      const success = await onVerify(code);
      
      if (!success) {
        toast({
          title: "Verification Failed",
          description: "The code you entered is incorrect.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("MFA verification error:", error);
      toast({
        title: "Verification Error",
        description: "An error occurred during verification. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter the verification code to complete your login
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code for {email}
          </p>
          
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            render={({ slots }) => (
              <InputOTPGroup>
                {slots.map((slot, index) => (
                  <InputOTPSlot key={index} {...slot} index={index} />
                ))}
              </InputOTPGroup>
            )}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleVerify} disabled={code.length !== 6 || isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
