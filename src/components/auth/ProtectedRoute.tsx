
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ExtendedUserRole } from '@/integrations/supabase/types-extensions';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'customer' | 'staff' | 'admin';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  
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
  
  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If specific role is required, check user role
  // This is a simplified implementation - in a real app you'd get the role from the profile
  if (requiredRole === 'admin') {
    // In a real app, check if user has admin role
    const userRole = user.app_metadata?.role || 'customer';
    if (userRole !== 'admin') {
      return <Navigate to="/shop" replace />;
    }
  }
  
  // Allow access
  return <>{children}</>;
};

export default ProtectedRoute;
