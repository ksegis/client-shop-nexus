
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

  // If not authenticated, redirect to main auth page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  // If no specific roles are required, or user has an allowed role
  if (
    allowedRoles.length === 0 || 
    (profile?.role && allowedRoles.includes(profile.role as UserRole))
  ) {
    return <>{children}</>;
  }
  
  // User doesn't have the required role
  return <Navigate to="/auth" replace />;
};

export default ProtectedRoute;
