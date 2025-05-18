
import { Button } from '@/components/ui/button';
import { Key } from 'lucide-react';

interface NoPasskeysStateProps {
  onAddAuthenticator: () => void;
}

export function NoPasskeysState({ onAddAuthenticator }: NoPasskeysStateProps) {
  return (
    <div className="p-4 text-center border rounded-md bg-muted/30">
      <p className="mb-4 text-sm text-muted-foreground">
        No security keys registered yet
      </p>
      <Button onClick={onAddAuthenticator}>
        <Key className="mr-2 h-4 w-4" />
        Register Security Key
      </Button>
    </div>
  );
}
