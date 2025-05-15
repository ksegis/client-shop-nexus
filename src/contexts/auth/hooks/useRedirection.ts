
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../useAuth';

export const useRedirection = () => {
  const { 
    user, 
    isLoading, 
    profile, 
    portalType,
    validateAccess 
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Track if the redirection logic is currently executing to prevent double redirects
    let isRedirecting = false;
    
    // CRITICAL: Skip redirection logic entirely when still loading OR when profile/portalType isn't determined yet
    if (isLoading || (user && (!profile || !portalType))) {
      console.log('🔄 Redirection: Loading auth state or waiting for profile data, skipping redirects');
      return;
    }

    // Check if we're on any auth-related pages - be more comprehensive about paths
    const isAuthPage = 
      location.pathname === '/auth' || 
      location.pathname === '/auth/login' ||
      location.pathname === '/auth/customer-login' ||
      location.pathname.startsWith('/auth/') ||
      location.pathname === '/shop/login' ||
      location.pathname === '/customer/login';
    
    // Keep track of the current path
    const currentPath = location.pathname;
    
    console.group('🔀 Redirection Logic');
    console.log('Current path:', currentPath);
    console.log('Is auth page:', isAuthPage);
    console.log('User authenticated:', !!user);
    console.log('Portal type:', portalType);
    console.log('Profile:', profile);
    
    // Case 1: Not authenticated trying to access protected page
    if (!user && !isAuthPage && !isRedirecting) {
      isRedirecting = true;
      console.log('➡️ Redirecting to /auth (not authenticated on protected page)');
      navigate('/auth', { 
        replace: true,
        state: { from: currentPath } 
      });
      console.groupEnd();
      return;
    } 
    
    // Case 2: Authenticated on auth page - redirect to appropriate portal 
    // ONLY if we have determined the portalType AND profile - this is critical to prevent loops
    if (user && isAuthPage && portalType && profile && !isRedirecting) {
      isRedirecting = true;
      const redirectPath = portalType === 'customer' ? '/customer' : '/shop';
      console.log(`➡️ Redirecting to ${redirectPath} (authenticated on auth page, portalType: ${portalType})`);
      
      // Add a slight delay to ensure other auth state processing completes
      const timer = setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 500); // Increased delay for more reliability
      
      console.groupEnd();
      return () => clearTimeout(timer);
    } 
    
    console.log('✅ No redirection needed');
    console.groupEnd();
  }, [user, isLoading, navigate, location.pathname, portalType, profile]);
};
