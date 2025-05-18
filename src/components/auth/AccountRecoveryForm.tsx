
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ShieldAlert } from 'lucide-react';
import { managementManager } from '@/services/auth/webauthn/managementManager';

interface AccountRecoveryFormProps {
  onCancel: () => void;
}

export const AccountRecoveryForm = ({ onCancel }: AccountRecoveryFormProps) => {
  const [email, setEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{type: 'info' | 'error' | 'success', text: string} | null>(null);
  const [timeDelay, setTimeDelay] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }
    
    setIsSubmitting(true);
    setMessage(null);
    
    try {
      const result = await managementManager.requestAccountRecovery(email);
      
      if (result.success) {
        if (result.timeDelay) {
          setTimeDelay(result.timeDelay);
          setMessage({ 
            type: 'info', 
            text: result.message
          });
        } else {
          setMessage({ 
            type: 'success', 
            text: result.message
          });
          setStep('code');
        }
      } else {
        // Still show success message for security (don't reveal if email exists)
        setMessage({ 
          type: 'info', 
          text: "If your email exists in our system, you'll receive recovery instructions."
        });
      }
    } catch (err: any) {
      console.error('Recovery request error:', err);
      setMessage({ 
        type: 'error', 
        text: 'An error occurred while processing your request. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderEmailForm = () => (
    <form onSubmit={handleEmailSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
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
          disabled={!email.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Requesting...
            </>
          ) : (
            'Request Recovery'
          )}
        </Button>
      </div>
    </form>
  );

  const renderCodeForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="recovery-code">Enter recovery code</Label>
        <Input
          id="recovery-code"
          placeholder="Enter your backup code"
          value={recoveryCode}
          onChange={(e) => setRecoveryCode(e.target.value)}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">
          Enter the recovery code sent to your email or one of your backup codes
        </p>
      </div>
      
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          type="button" 
          onClick={() => setStep('email')}
          disabled={isSubmitting}
        >
          Back
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
            'Recover Account'
          )}
        </Button>
      </div>
      
      <div className="text-center">
        <Button 
          variant="link"
          onClick={() => setStep('email')}
          type="button"
          className="text-xs"
        >
          Try a different email
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" />
          Account Recovery
        </CardTitle>
        <CardDescription>
          {step === 'email' 
            ? 'Enter your email to begin account recovery'
            : 'Enter the recovery code sent to your email'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {timeDelay ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              For security reasons, recovery is temporarily locked. Please try again in {timeDelay}.
              {timeDelay === '72h' && (
                <div className="mt-2 text-sm">
                  Due to multiple recovery attempts, admin approval may be required. 
                  Contact support for assistance.
                </div>
              )}
            </AlertDescription>
          </Alert>
        ) : step === 'email' ? renderEmailForm() : renderCodeForm()}
      </CardContent>
      
      <CardFooter className="flex flex-col text-xs text-muted-foreground">
        <p>Need help? Contact our support team for assistance.</p>
      </CardFooter>
    </Card>
  );
};
