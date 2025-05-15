
import { ReactNode, useEffect, useRef } from 'react';
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
  const lastRedirectTime = useRef(0);

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
        const hasRole = validateAccess(allowedRoles);
        console.log('Has required role:', hasRole);
      }
      
      if (requiredPortal) {
        console.log('Has portal access:', portalType === requiredPortal);
      }
      
      console.groupEnd();
    }
  }, [location.pathname, isLoading, isAuthenticated, profile, portalType, requiredPortal, allowedRoles, validateAccess]);

  // Prevent redirect loops by enforcing minimum time between redirects
  const currentTime = Date.now();
  if (currentTime - lastRedirectTime.current < 3000) {
    console.log('🛑 Protected Route: Too many redirects in a short period, showing loading state');
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // IMPROVED LOADING STATE: Handle loading state OR when profile data isn't loaded yet
  // This prevents premature redirects when we have a user but profile data isn't ready
  if (isLoading || (isAuthenticated && (!profile || !portalType))) {
    // Show loading state while checking authentication or waiting for profile
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log(`🚫 Access denied: Not authenticated, redirecting to /auth from ${location.pathname}`);
    lastRedirectTime.current = currentTime;
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  // CRITICAL: Only proceed with role and portal checks when we have complete profile data
  if (!profile || !portalType) {
    // This is a fallback safety check - we should never reach here
    // due to the loading check above, but just in case
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Check if user has the correct role - use validateAccess for consistent role checking
  const hasRole = allowedRoles.length === 0 || validateAccess(allowedRoles);
  
  // Check if user has access to the correct portal
  const hasPortalAccess = !requiredPortal || portalType === requiredPortal;

  // If user doesn't have the right role or portal access, redirect to an appropriate location
  if (!hasRole || !hasPortalAccess) {
    // Only redirect if we have determined the portalType
    if (portalType) {
      // Redirect to their default portal
      const defaultPath = portalType === 'customer' ? '/customer' : '/shop';
      
      console.log(`🚫 Access denied: Role or portal mismatch, redirecting to ${defaultPath} from ${location.pathname}`);
      console.log('Role check:', { 
        hasRole, 
        hasPortalAccess, 
        userRole: profile?.role,
        allowedRoles: allowedRoles
      });
        
      lastRedirectTime.current = currentTime;
      return <Navigate to={defaultPath} replace />;
    } else {
      // If portal type is not determined yet, show loading
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      );
    }
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
