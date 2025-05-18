
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Key, Trash2 } from 'lucide-react';
import { webAuthnService, RegisteredAuthenticator } from '@/services/auth/webauthn';
import { formatDistanceToNow } from 'date-fns';

interface PasskeyManagerProps {
  userId: string;
}

export function PasskeyManager({ userId }: PasskeyManagerProps) {
  const [authenticators, setAuthenticators] = useState<RegisteredAuthenticator[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  // Check if WebAuthn is supported and load authenticators
  useEffect(() => {
    const initialize = async () => {
      const supported = webAuthnService.isSupported();
      setIsSupported(supported);
      
      if (supported && userId) {
        await loadAuthenticators();
      } else {
        setLoading(false);
      }
    };
    
    initialize();
  }, [userId]);

  const loadAuthenticators = async () => {
    setLoading(true);
    const data = await webAuthnService.getUserAuthenticators(userId);
    setAuthenticators(data);
    setLoading(false);
  };

  const handleAddAuthenticator = () => {
    setDeviceName('');
    setIsDialogOpen(true);
  };

  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      const success = await webAuthnService.registerCredential(userId, deviceName);
      
      if (success) {
        toast({
          title: "Security key registered",
          description: "Your security key has been registered successfully"
        });
        setIsDialogOpen(false);
        loadAuthenticators();
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

  const handleDeleteAuthenticator = async (id: string) => {
    setIsDeleting(id);
    try {
      const success = await webAuthnService.deleteAuthenticator(id);
      
      if (success) {
        toast({
          title: "Security key removed",
          description: "Your security key has been removed successfully"
        });
        setAuthenticators(prev => prev.filter(auth => auth.id !== id));
      } else {
        toast({
          title: "Removal failed",
          description: "Failed to remove security key. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error removing key:', error);
      toast({
        title: "Removal failed",
        description: "An error occurred while removing your security key",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(null);
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Keys</CardTitle>
          <CardDescription>
            Your browser doesn't support WebAuthn security keys or passkeys
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Security Keys & Passkeys</CardTitle>
        <CardDescription>
          Add security keys or passkeys to secure your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {authenticators.length === 0 ? (
              <div className="p-4 text-center border rounded-md bg-muted/30">
                <p className="mb-4 text-sm text-muted-foreground">
                  No security keys registered yet
                </p>
                <Button onClick={handleAddAuthenticator}>
                  <Key className="mr-2 h-4 w-4" />
                  Register Security Key
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <ul className="space-y-3">
                  {authenticators.map((auth) => (
                    <li key={auth.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div>
                        <div className="font-medium">{auth.device_name}</div>
                        <div className="text-xs text-muted-foreground">
                          Added {formatDistanceToNow(new Date(auth.created_at))} ago
                          {auth.last_used_at && (
                            <>
                              <span className="mx-1">•</span>
                              Last used {formatDistanceToNow(new Date(auth.last_used_at))} ago
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAuthenticator(auth.id)}
                        disabled={isDeleting === auth.id}
                      >
                        {isDeleting === auth.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
                <Button onClick={handleAddAuthenticator}>
                  <Key className="mr-2 h-4 w-4" />
                  Register Another Security Key
                </Button>
              </div>
            )}
          </>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                  onClick={() => setIsDialogOpen(false)}
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
      </CardContent>
    </Card>
  );
}
