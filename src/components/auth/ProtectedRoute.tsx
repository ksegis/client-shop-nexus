
import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { UserRole } from '@/contexts/auth/types';
import { TestModeBanner } from './TestModeBanner';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requiredPortal?: 'shop' | 'customer';
}

const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  requiredPortal 
}: ProtectedRouteProps) => {
  const { 
    isAuthenticated, 
    isLoading, 
    profile, 
    portalType,
    validateAccess 
  } = useAuth();
  const location = useLocation();

  // Handle routing based on authentication state
  if (isLoading) {
    // Show loading state while checking authentication
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  // Check if user has the correct role
  const hasRole = allowedRoles.length === 0 || validateAccess(allowedRoles);
  
  // Check if user has access to the correct portal
  const hasPortalAccess = !requiredPortal || portalType === requiredPortal;

  // If user doesn't have the right role or portal access, redirect to an appropriate location
  if (!hasRole || !hasPortalAccess) {
    // Redirect to their default portal
    const defaultPath = profile?.role ? 
      (profile.role.includes('customer') ? '/customer' : '/shop') : 
      '/auth';
      
    return <Navigate to={defaultPath} replace />;
  }

  // User has required role and portal access
  return (
    <>
      <TestModeBanner />
      {children}
    </>
  );
};

export default ProtectedRoute;
