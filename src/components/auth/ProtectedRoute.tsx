
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
  
  // If not authenticated, redirect to shop login
  if (!user) {
    return <Navigate to="/shop/login" replace />;
  }

  // If specific role is required, check user role
  if (requiredRole) {
    // Get user role from metadata or default to 'customer'
    const userRole = user.app_metadata?.role as ExtendedUserRole || 'customer';
    
    // Check if user's role matches required role or has higher permissions
    const hasAccess = 
      (requiredRole === 'customer') || 
      (requiredRole === 'staff' && (userRole === 'staff' || userRole === 'admin')) ||
      (requiredRole === 'admin' && userRole === 'admin');
    
    if (!hasAccess) {
      // Redirect to appropriate page based on user's role
      return <Navigate to="/shop" replace />;
    }
  }
  
  // Allow access
  return <>{children}</>;
};

export default ProtectedRoute;
