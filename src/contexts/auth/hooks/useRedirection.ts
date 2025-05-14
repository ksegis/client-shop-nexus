
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../useAuth';

export const useRedirection = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    const isAuthPage = 
      location.pathname === '/auth' || 
      location.pathname === '/shop/login';
    
    // Only redirect if on auth pages and authenticated, or if not authenticated and not on auth pages
    if (!user && !isAuthPage) {
      // Redirect to login if not authenticated
      navigate('/shop/login', { replace: true });
    } else if (user && isAuthPage) {
      // Redirect to shop dashboard if already authenticated
      const redirectPath = user?.user_metadata?.role?.includes('customer') ? 
        '/customer' : '/shop';
      navigate(redirectPath, { replace: true });
    }
    
    // Do not redirect between different authenticated pages (e.g. profile to vehicles)
  }, [user, isLoading, navigate, location.pathname]);
};
