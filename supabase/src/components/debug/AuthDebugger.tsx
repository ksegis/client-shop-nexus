
import { useAuthDiagnostics } from '@/hooks/useAuthDiagnostics';

interface AuthDebuggerProps {
  componentName?: string;
}

/**
 * A component that can be added anywhere in the application to log auth diagnostics.
 * This is for troubleshooting only and should be removed in production.
 */
export const AuthDebugger = ({ componentName = 'AuthDebugger' }: AuthDebuggerProps) => {
  useAuthDiagnostics(componentName);
  
  // Development mode only UI indicator
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-black/70 text-white text-xs p-2 rounded">
        🔍 Auth Debugging Active
      </div>
    );
  }
  
  return null;
};
