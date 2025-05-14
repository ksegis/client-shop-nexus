
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../useAuth';

export const useRedirection = () => {
  const { user, isLoading, portalType } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Skip redirection logic entirely when still loading
    if (isLoading) {
      console.log('🔄 Redirection: Loading auth state, skipping redirects');
      return;
    }

    // Check if we're on any auth-related pages - be more comprehensive about paths
    const isAuthPage = 
      location.pathname === '/auth' || 
      location.pathname === '/auth/login' ||
      location.pathname === '/auth/customer-login' ||
      location.pathname.startsWith('/auth/') ||
      location.pathname === '/shop/login';
    
    // Keep a state parameter to remember where we came from
    const currentPath = location.pathname;
    const fromParam = location.state?.from ? `?from=${encodeURIComponent(location.state.from)}` : '';
    
    console.group('🔀 Redirection Logic');
    console.log('Current path:', currentPath);
    console.log('Is auth page:', isAuthPage);
    console.log('User authenticated:', !!user);
    if (user) {
      console.log('User role from metadata:', user?.user_metadata?.role);
      console.log('Portal type:', portalType);
    }
    
    // Only redirect if:
    // 1. Not authenticated AND trying to access a protected page (not auth page)
    // 2. Already authenticated AND on an auth page
    
    // Case 1: Not authenticated trying to access protected page
    if (!user && !isAuthPage) {
      console.log('➡️ Redirecting to /auth (not authenticated on protected page)');
      navigate('/auth', { 
        replace: true,
        state: { from: currentPath } 
      });
    } 
    // Case 2: Authenticated on auth page - redirect to appropriate portal
    else if (user && isAuthPage) {
      // Determine redirect based on portalType rather than parsing user metadata again
      const redirectPath = portalType === 'customer' ? '/customer' : '/shop';
      console.log(`➡️ Redirecting to ${redirectPath} (authenticated on auth page)`);
      navigate(redirectPath, { replace: true });
    } 
    else {
      console.log('✅ No redirection needed');
    }
    
    console.groupEnd();
  }, [user, isLoading, navigate, location, portalType]);
};
