
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { RegisteredAuthenticator } from '@/services/auth/webauthn';
import { Button } from '@/components/ui/button';
import { Loader2, Key, Trash2 } from 'lucide-react';

interface PasskeyListProps {
  authenticators: RegisteredAuthenticator[];
  onDelete: (id: string) => Promise<boolean>;
  onDeleteSuccess: (id: string) => void;
  onDeleteError: () => void;
  onAddAuthenticator: () => void;
}

export function PasskeyList({ 
  authenticators, 
  onDelete, 
  onDeleteSuccess, 
  onDeleteError, 
  onAddAuthenticator 
}: PasskeyListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDeleteAuthenticator = async (id: string) => {
    setIsDeleting(id);
    try {
      const success = await onDelete(id);
      
      if (success) {
        onDeleteSuccess(id);
      } else {
        onDeleteError();
      }
    } catch (error) {
      console.error('Error removing key:', error);
      onDeleteError();
    } finally {
      setIsDeleting(null);
    }
  };

  return (
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
      <Button onClick={onAddAuthenticator}>
        <Key className="mr-2 h-4 w-4" />
        Register Another Security Key
      </Button>
    </div>
  );
}
