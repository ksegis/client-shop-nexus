
import { useState } from 'react';
import { webAuthnService } from '@/services/auth/webauthn';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RegisterPasskeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess: () => void;
}

export function RegisterPasskeyDialog({ 
  open, 
  onOpenChange, 
  userId, 
  onSuccess 
}: RegisterPasskeyDialogProps) {
  const [deviceName, setDeviceName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();

  const handleRegister = async () => {
    if (!deviceName.trim()) return;
    
    setIsRegistering(true);
    try {
      const success = await webAuthnService.registerCredential(userId, deviceName);
      
      if (success) {
        onSuccess();
      } else {
        toast({
          title: "Registration failed",
          description: "Failed to register security key. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error registering key:', error);
      toast({
        title: "Registration failed",
        description: "An error occurred while registering your security key",
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register Security Key</DialogTitle>
          <DialogDescription>
            Add a security key or passkey to your account for enhanced security
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deviceName">Device Name</Label>
              <Input
                id="deviceName"
                placeholder="e.g., My iPhone or YubiKey"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                disabled={isRegistering}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isRegistering}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isRegistering || !deviceName.trim()}>
              {isRegistering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
