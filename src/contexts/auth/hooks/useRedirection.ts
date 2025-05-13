
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

export function useRedirection() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect user based on their role and current path
  const redirectUserBasedOnRole = useCallback((role: string, currentPath: string) => {
    console.log("Redirecting based on role:", role, "Current path:", currentPath);
    
    // Don't redirect if already on auth page
    if (currentPath === '/auth') {
      console.log("Already on auth page, not redirecting");
      return;
    }
    
    const isShopPath = currentPath.startsWith('/shop');
    const isCustomerPath = currentPath.startsWith('/customer');
    const isAuthPath = currentPath === '/auth' || currentPath === '/';
    
    // If no role, redirect to auth page to break potential redirect loops
    if (!role) {
      console.log("No role found - redirecting to auth page");
      navigate('/auth', { replace: true });
      return;
    }
    
    // Only redirect if on an auth path or if trying to access wrong portal
    if (isAuthPath) {
      // Redirect from auth to appropriate portal
      if (role === 'customer') {
        navigate('/customer/profile', { replace: true });
      } else if (role === 'staff' || role === 'admin') {
        navigate('/shop', { replace: true });
      }
    } 
    // Strict enforcement of portal access based on role
    else if (role === 'customer' && isShopPath) {
      // Customer trying to access shop portal - redirect to customer portal
      console.log('Customer attempting to access shop portal - redirecting to customer portal');
      toast({
        title: "Access Restricted",
        description: "Customers can only access the Customer Portal.",
        variant: "destructive",
      });
      navigate('/customer/profile', { replace: true });
    } else if ((role === 'staff' || role === 'admin') && isCustomerPath) {
      // Staff/admin trying to access customer portal - redirect to shop portal
      console.log('Staff/admin attempting to access customer portal - redirecting to shop portal');
      toast({
        title: "Portal Changed",
        description: "Staff members use the Shop Management Portal.",
      });
      navigate('/shop', { replace: true });
    }
  }, [navigate, toast]);

  // Function to get the appropriate redirect path based on user role
  const getRedirectPathByRole = useCallback((role?: string): string => {
    if (!role) return '/auth';
    
    switch (role) {
      case 'admin':
      case 'staff':
        return '/shop';
      case 'customer':
        return '/customer/profile';
      default:
        return '/auth';
    }
  }, []);

  return { redirectUserBasedOnRole, getRedirectPathByRole };
}
