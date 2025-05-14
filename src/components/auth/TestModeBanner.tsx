
import { useAuth } from '@/contexts/auth';
import { UserRole } from '@/contexts/auth/types';
import { AlertCircle } from 'lucide-react';

interface TestModeBannerProps {
  className?: string;
}

export function TestModeBanner({ className = "" }: TestModeBannerProps) {
  const { isTestUser, profile, stopImpersonation } = useAuth();
  
  if (!isTestUser) return null;
  
  const role = profile?.role as UserRole;
  const roleName = role?.replace('test_', '').toUpperCase() || 'UNKNOWN';
  
  return (
    <div className={`bg-yellow-500 text-yellow-950 px-4 py-2 flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        <span className="font-medium">TEST MODE: {roleName}</span>
        <span className="text-sm hidden sm:inline-block">
          - This is a test account. No changes will affect production data.
        </span>
      </div>
      <button 
        onClick={stopImpersonation}
        className="text-sm bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded"
      >
        Exit Test Mode
      </button>
    </div>
  );
}
