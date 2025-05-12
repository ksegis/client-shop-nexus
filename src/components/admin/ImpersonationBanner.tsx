
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isImpersonating, getOriginalUser, useImpersonation } from '@/utils/admin/impersonationUtils';
import { useAuth } from '@/contexts/AuthContext';

const ImpersonationBanner = () => {
  const { user } = useAuth();
  const { stopImpersonatingUser } = useImpersonation();
  
  if (!isImpersonating()) {
    return null;
  }
  
  const originalUser = getOriginalUser();
  
  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 p-2">
      <div className="container max-w-screen-xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className="text-sm text-amber-800">
            You are viewing as{' '}
            <strong>{user?.user_metadata?.first_name || user?.email}</strong> (
            {user?.app_metadata?.role || 'customer'})
          </span>
        </div>
        
        <Button
          size="sm"
          variant="outline"
          className="text-amber-800 border-amber-300 hover:bg-amber-100"
          onClick={() => stopImpersonatingUser()}
        >
          Return to admin ({originalUser?.email})
        </Button>
      </div>
    </div>
  );
};

export default ImpersonationBanner;
