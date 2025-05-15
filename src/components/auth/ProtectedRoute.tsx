
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { UserRole } from '@/contexts/auth/types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ 
  children, 
  allowedRoles = []
}: ProtectedRouteProps) => {
  const { user, profile, isLoading } = useAuth();
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // If not authenticated, redirect to appropriate login page based on the roles
  if (!user) {
    // If we're trying to access customer routes, redirect to customer login
    if (allowedRoles.includes('customer')) {
      return <Navigate to="/customer-login" replace />;
    }
    
    // If we're trying to access shop/admin routes, redirect to shop login
    if (allowedRoles.includes('staff') || allowedRoles.includes('admin')) {
      return <Navigate to="/shop-login" replace />;
    }
    
    // Default fallback to main index
    return <Navigate to="/" replace />;
  }
  
  // If no specific roles are required, or user has an allowed role
  if (
    allowedRoles.length === 0 || 
    (profile?.role && allowedRoles.includes(profile.role as UserRole))
  ) {
    return <>{children}</>;
  }
  
  // User doesn't have the required role - redirect to their appropriate portal
  if (profile?.role === 'customer') {
    return <Navigate to="/customer" replace />;
  } else if (profile?.role === 'staff' || profile?.role === 'admin') {
    return <Navigate to="/shop" replace />;
  }
  
  // Final fallback
  return <Navigate to="/" replace />;
};

export default ProtectedRoute;
