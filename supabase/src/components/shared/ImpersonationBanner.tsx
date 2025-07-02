
import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserCog, X } from 'lucide-react';
import { useImpersonation } from '@/utils/admin/impersonationUtils';

export const ImpersonationBanner = () => {
  const { exitImpersonation } = useImpersonation();
  
  // Check if we're in an impersonation session
  const impersonationData = localStorage.getItem('impersonation-session');
  
  if (!impersonationData) {
    return null;
  }
  
  const parsedData = JSON.parse(impersonationData);
  const userName = `${parsedData.user_metadata?.first_name || ''} ${parsedData.user_metadata?.last_name || ''}`.trim();
  const userEmail = parsedData.email;
  
  return (
    <Alert className="bg-orange-50 border-orange-200 mb-4">
      <UserCog className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-orange-800">
          <strong>Impersonating:</strong> {userName || userEmail} ({userEmail})
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={exitImpersonation}
          className="ml-4 border-orange-300 text-orange-700 hover:bg-orange-100"
        >
          <X className="h-3 w-3 mr-1" />
          Exit Impersonation
        </Button>
      </AlertDescription>
    </Alert>
  );
};
