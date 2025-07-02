
import { ReactNode, useEffect } from 'react';
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
  const { user, profile, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // For debugging - log auth state
  useEffect(() => {
    console.log('Protected route auth state:', { 
      isLoading, 
      isAuthenticated, 
      user: !!user,
      userRole: profile?.role,
      requiredRoles: allowedRoles,
      path: location.pathname
    });
  }, [isLoading, isAuthenticated, user, profile, allowedRoles, location.pathname]);

  // If still loading auth state, show loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
          <p className="text-sm text-muted-foreground">Verifying credentials...</p>
        </div>
      </div>
    );
  }
  
  // If no user, redirect to login
  if (!user || !isAuthenticated) {
    console.log('No authenticated user, redirecting to login');
    return <Navigate to="/shop-login" state={{ from: location }} replace />;
  }
  
  // If no specific roles required or no profile yet, just ensure authenticated
  if (!allowedRoles || allowedRoles.length === 0 || !profile) {
    return <>{children}</>;
  }
  
  // Check if user has one of the allowed roles
  const userRole = profile.role as UserRole;
  const hasRequiredRole = allowedRoles.includes(userRole);
  
  // If not authorized, redirect to unauthorized page
  if (!hasRequiredRole) {
    console.log('User does not have required role, redirecting to unauthorized');
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }
  
  // User is authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;
