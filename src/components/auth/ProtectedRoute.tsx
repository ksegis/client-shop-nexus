
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { UserRole } from '@/contexts/auth/types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ 
  children, 
  allowedRoles 
}: ProtectedRouteProps) => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthorization = async () => {
      // If still loading auth state, wait
      if (isLoading) {
        return;
      }
      
      // If no user, not authorized
      if (!user) {
        setIsAuthorized(false);
        return;
      }
      
      // If no specific roles required, just being logged in is enough
      if (!allowedRoles || allowedRoles.length === 0) {
        setIsAuthorized(true);
        return;
      }
      
      // Check if user has one of the allowed roles
      const userRole = profile?.role as UserRole;
      const hasRequiredRole = allowedRoles.includes(userRole);
      setIsAuthorized(hasRequiredRole);
    };
    
    checkAuthorization();
  }, [user, profile, allowedRoles, isLoading]);

  // Show nothing while loading or checking authorization
  if (isLoading || isAuthorized === null) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // Redirect to unauthorized page if authenticated but not authorized
  if (!isAuthorized) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }
  
  // User is authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;
