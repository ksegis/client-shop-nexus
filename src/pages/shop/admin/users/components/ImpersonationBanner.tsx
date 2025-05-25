
import React from 'react';
import { Button } from '@/components/ui/button';
import { useUserManagement } from '../UserManagementContext';

export function ImpersonationBanner() {
  const { isImpersonationActive, exitImpersonationMode, getImpersonatedUser } = useUserManagement();

  if (!isImpersonationActive()) {
    return null;
  }

  const impersonatedUser = getImpersonatedUser();

  return (
    <div className="bg-yellow-100 border border-yellow-400 rounded-md p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-yellow-800 font-medium">
            Impersonation Mode Active
          </p>
          <p className="text-yellow-700 text-sm">
            You are currently impersonating: {impersonatedUser}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exitImpersonationMode}
          className="bg-white hover:bg-gray-50"
        >
          Exit Impersonation
        </Button>
      </div>
    </div>
  );
}
