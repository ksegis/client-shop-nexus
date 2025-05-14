
import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { UserRole, getBaseRole } from '@/contexts/auth/types';
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

  // Add debugging for protected route
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🔒 ProtectedRoute');
      console.log('Path:', location.pathname);
      console.log('Auth loading:', isLoading);
      console.log('Allowed roles:', allowedRoles);
      console.log('Required portal:', requiredPortal);
      console.log('User authenticated:', isAuthenticated);
      console.log('User profile:', profile);
      console.log('User portal type:', portalType);
      
      if (profile?.role && allowedRoles.length > 0) {
        console.log('Has required role:', validateAccess(allowedRoles));
      }
      
      if (requiredPortal) {
        console.log('Has portal access:', portalType === requiredPortal);
      }
      
      console.groupEnd();
    }
  }, [location.pathname, isLoading, isAuthenticated, profile, portalType, requiredPortal, allowedRoles, validateAccess]);

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
    console.log(`🚫 Access denied: Not authenticated, redirecting to /auth from ${location.pathname}`);
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  // Check if user has the correct role - use validateAccess for consistent role checking
  const hasRole = allowedRoles.length === 0 || validateAccess(allowedRoles);
  
  // Check if user has access to the correct portal
  const hasPortalAccess = !requiredPortal || portalType === requiredPortal;

  // If user doesn't have the right role or portal access, redirect to an appropriate location
  if (!hasRole || !hasPortalAccess) {
    // Redirect to their default portal
    const defaultPath = portalType === 'customer' ? '/customer' : '/shop';
    
    console.log(`🚫 Access denied: Role or portal mismatch, redirecting to ${defaultPath} from ${location.pathname}`);
    console.log('Role check:', { 
      hasRole, 
      hasPortalAccess, 
      userRole: profile?.role,
      allowedRoles: allowedRoles
    });
      
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
