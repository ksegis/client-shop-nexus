
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserImpersonation } from '../hooks/useUserImpersonation';

export const ImpersonationBanner: React.FC = () => {
  const { isImpersonationActive, getImpersonatedUser, exitImpersonationMode } = useUserImpersonation();
  
  if (!isImpersonationActive()) {
    return null;
  }

  const impersonatedUser = getImpersonatedUser();

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
        </div>
        <div className="ml-3 flex-grow">
          <p className="text-sm text-yellow-700">
            You are currently impersonating <strong>{impersonatedUser}</strong>. 
            Remember to exit this mode when you're done.
          </p>
        </div>
        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={exitImpersonationMode}
            className="bg-white hover:bg-yellow-50 border-yellow-500 text-yellow-700"
          >
            Exit Impersonation
          </Button>
        </div>
      </div>
    </div>
  );
};
