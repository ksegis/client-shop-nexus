
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { webAuthnService, RegisteredAuthenticator } from '@/services/auth/webauthn';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PasskeyList } from './PasskeyList';
import { UnsupportedPasskeyState } from './UnsupportedPasskeyState';
import { NoPasskeysState } from './NoPasskeysState';
import { RegisterPasskeyDialog } from './RegisterPasskeyDialog';

interface PasskeyManagerProps {
  userId: string;
}

export function PasskeyManager({ userId }: PasskeyManagerProps) {
  const [authenticators, setAuthenticators] = useState<RegisteredAuthenticator[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  const handleRegisterSuccess = () => {
    toast({
      title: "Security key registered",
      description: "Your security key has been registered successfully"
    });
    setIsDialogOpen(false);
    loadAuthenticators();
  };

  const handleDeleteSuccess = (id: string) => {
    toast({
      title: "Security key removed",
      description: "Your security key has been removed successfully"
    });
    setAuthenticators(prev => prev.filter(auth => auth.id !== id));
  };

  const handleDeleteError = () => {
    toast({
      title: "Removal failed",
      description: "Failed to remove security key. Please try again.",
      variant: "destructive"
    });
  };

  if (!isSupported) {
    return <UnsupportedPasskeyState />;
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
          <PasskeyLoadingState />
        ) : (
          <>
            {authenticators.length === 0 ? (
              <NoPasskeysState onAddAuthenticator={() => setIsDialogOpen(true)} />
            ) : (
              <PasskeyList 
                authenticators={authenticators}
                onDelete={webAuthnService.deleteAuthenticator}
                onDeleteSuccess={handleDeleteSuccess}
                onDeleteError={handleDeleteError}
                onAddAuthenticator={() => setIsDialogOpen(true)}
              />
            )}
          </>
        )}

        <RegisterPasskeyDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          userId={userId}
          onSuccess={handleRegisterSuccess}
        />
      </CardContent>
    </Card>
  );
}

function PasskeyLoadingState() {
  return (
    <div className="flex justify-center py-4">
      <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

// Import the Loader2 icon
import { Loader2 as Loader2Icon } from 'lucide-react';
