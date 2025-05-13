
import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading, getRedirectPathByRole } = useAuth();
  const location = useLocation();
  
  // If still loading, show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }
  
  // If not authenticated, redirect to appropriate login
  if (!user) {
    const loginPath = location.pathname.startsWith('/shop') 
      ? '/shop/login'
      : '/customer/login';
      
    return <Navigate to={loginPath} replace />;
  }
  
  // Check if role-based restriction applies
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.app_metadata?.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      // User doesn't have an appropriate role - redirect to their default area
      const redirectPath = getRedirectPathByRole(userRole);
      return <Navigate to={redirectPath} replace />;
    }
  }
  
  // Check path vs. user role
  const userRole = user.app_metadata?.role;
  if (userRole === 'customer' && location.pathname.startsWith('/shop')) {
    // Customer trying to access shop routes
    return <Navigate to="/customer/profile" replace />;
  } else if ((userRole === 'staff' || userRole === 'admin') && location.pathname.startsWith('/customer')) {
    // Staff/admin trying to access customer routes
    return <Navigate to="/shop" replace />;
  }
  
  // Allow access
  return <>{children}</>;
};

export default ProtectedRoute;
