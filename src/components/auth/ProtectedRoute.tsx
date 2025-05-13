
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { toast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [hasShownToast, setHasShownToast] = useState(false);
  
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
  
  // Get user role from metadata if it exists
  const userRole = user.app_metadata?.role;
  
  // If no role is assigned yet, redirect to auth
  if (!userRole) {
    console.log("No user role found, redirecting to auth page");
    return <Navigate to="/auth" replace />;
  }
  
  // If allowedRoles is specified, check if user has an allowed role
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(userRole)) {
      // Determine where to redirect based on role
      const redirectPath = userRole === 'customer' 
        ? '/customer/profile'
        : (userRole === 'admin' || userRole === 'staff') 
          ? '/shop' 
          : '/auth';
      
      // Show toast message on next render, but only once
      if (!hasShownToast) {
        setTimeout(() => {
          toast({
            title: "Access Restricted",
            description: "You don't have permission to access this area",
            variant: "destructive",
          });
          setHasShownToast(true);
        }, 0);
      }
      
      return <Navigate to={redirectPath} replace />;
    }
  }
  
  // Portal-specific checks
  if (userRole === 'customer' && location.pathname.startsWith('/shop')) {
    // Customer trying to access shop routes - block and redirect
    if (!hasShownToast) {
      setTimeout(() => {
        toast({
          title: "Access Restricted",
          description: "Customers can only access the Customer Portal",
          variant: "destructive",
        });
        setHasShownToast(true);
      }, 0);
    }
    
    return <Navigate to="/customer/profile" replace />;
  } else if ((userRole === 'staff' || userRole === 'admin') && location.pathname.startsWith('/customer')) {
    // Staff/admin trying to access customer routes - redirect to shop portal
    return <Navigate to="/shop" replace />;
  }
  
  // Allow access
  return <>{children}</>;
};

export default ProtectedRoute;
