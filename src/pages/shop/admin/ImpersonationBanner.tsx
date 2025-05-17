
import React from 'react';
import { useImpersonation } from '@/utils/admin/impersonationUtils';
import { AlertCircle, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/auth';

export const ImpersonationBanner: React.FC = () => {
  const { user } = useAuth();
  const { exitImpersonation } = useImpersonation();
  
  // Check if we have an impersonation session
  const impersonationSession = localStorage.getItem('impersonation-session');
  
  if (!impersonationSession) return null;
  
  // Parse the impersonation data
  const originalUser = (() => {
    try {
      const data = JSON.parse(impersonationSession);
      return data.user_metadata?.original_user || null;
    } catch (e) {
      return null;
    }
  })();
  
  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded mb-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-amber-400" />
        </div>
        <div className="ml-3 flex-1 md:flex md:justify-between items-center">
          <p className="text-sm text-amber-700">
            <span className="font-semibold">IMPERSONATION ACTIVE: </span> 
            You are viewing as {user?.email || 'another user'}
          </p>
          <div className="mt-3 md:mt-0 md:ml-6">
            <button
              onClick={() => exitImpersonation()}
              className="inline-flex items-center rounded-md border border-transparent bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              <LogOut className="mr-2 h-4 w-4" />
              End Impersonation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
