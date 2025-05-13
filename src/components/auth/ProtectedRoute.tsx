
import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { toast } from '@/hooks/use-toast';

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
  
  // Get user role from metadata
  const userRole = user.app_metadata?.role;
  
  // Check path vs. user role - strict portal access enforcement
  if (userRole === 'customer' && location.pathname.startsWith('/shop')) {
    // Customer trying to access shop routes - block and redirect
    console.log("Customer blocked from accessing shop portal:", user.email);
    
    // Show toast message on next render
    setTimeout(() => {
      toast({
        title: "Access Restricted",
        description: "Customers can only access the Customer Portal",
        variant: "destructive",
      });
    }, 0);
    
    // Redirect to customer portal
    return <Navigate to="/customer/profile" replace />;
  } else if ((userRole === 'staff' || userRole === 'admin') && location.pathname.startsWith('/customer')) {
    // Staff/admin trying to access customer routes - redirect to shop portal
    return <Navigate to="/shop" replace />;
  }
  
  // Check if role-based restriction applies
  if (allowedRoles && allowedRoles.length > 0) {
    if (!userRole || !allowedRoles.includes(userRole)) {
      // User doesn't have an appropriate role - redirect to their default area
      const redirectPath = getRedirectPathByRole(userRole);
      
      // Show toast message on next render
      setTimeout(() => {
        toast({
          title: "Access Restricted",
          description: "You don't have permission to access this area",
          variant: "destructive",
        });
      }, 0);
      
      return <Navigate to={redirectPath} replace />;
    }
  }
  
  // Allow access
  return <>{children}</>;
};

export default ProtectedRoute;
