
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
  const [mounted, setMounted] = useState(false);
  
  // Set mounted state after initial render
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Add a small delay for role checking to prevent flashing content
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (!loading && !hasShownToast && mounted) {
      if (user && allowedRoles && !allowedRoles.includes(user.app_metadata?.role)) {
        timer = setTimeout(() => {
          toast({
            title: "Access Restricted",
            description: "You don't have permission to access this area",
            variant: "destructive",
          });
          setHasShownToast(true);
        }, 100);
      }
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading, user, mounted, hasShownToast, allowedRoles]);
  
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
  
  // If not authenticated, redirect to appropriate login with the return URL
  if (!user) {
    const loginPath = location.pathname.startsWith('/shop') 
      ? '/shop/login'
      : '/customer/login';
      
    return <Navigate to={loginPath} state={{ from: location.pathname }} replace />;
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
      
      return <Navigate to={redirectPath} replace />;
    }
  }
  
  // Portal-specific checks for additional security
  if (userRole === 'customer' && location.pathname.startsWith('/shop')) {
    return <Navigate to="/customer/profile" replace />;
  } else if ((userRole === 'staff' || userRole === 'admin') && location.pathname.startsWith('/customer')) {
    return <Navigate to="/shop" replace />;
  }
  
  // Allow access
  return <>{children}</>;
};

export default ProtectedRoute;
