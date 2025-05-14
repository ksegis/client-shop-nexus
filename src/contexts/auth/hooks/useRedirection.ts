
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../useAuth';

export const useRedirection = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) {
      console.log('🔄 Redirection: Loading auth state, skipping redirects');
      return;
    }

    // Check if we're on any auth-related pages
    const isAuthPage = 
      location.pathname === '/auth' || 
      location.pathname === '/auth/login' ||
      location.pathname === '/shop/login';
    
    console.group('🔀 Redirection Logic');
    console.log('Current path:', location.pathname);
    console.log('Is auth page:', isAuthPage);
    console.log('User authenticated:', !!user);
    if (user) {
      console.log('User role from metadata:', user?.user_metadata?.role);
    }
    
    // Only redirect if on auth pages and authenticated, or if not authenticated and not on auth pages
    if (!user && !isAuthPage) {
      // Redirect to login if not authenticated
      console.log('➡️ Redirecting to /auth (not authenticated on protected page)');
      navigate('/auth', { replace: true });
    } else if (user && isAuthPage) {
      // Redirect to shop dashboard if already authenticated
      const redirectPath = user?.user_metadata?.role?.includes('customer') ? 
        '/customer' : '/shop';
      console.log(`➡️ Redirecting to ${redirectPath} (authenticated on auth page)`);
      navigate(redirectPath, { replace: true });
    } else {
      console.log('✅ No redirection needed');
    }
    console.groupEnd();
    
    // Do not redirect between different authenticated pages (e.g. profile to vehicles)
  }, [user, isLoading, navigate, location.pathname]);
};
