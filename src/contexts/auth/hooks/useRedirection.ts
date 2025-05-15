
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthFlowLogs } from '@/hooks/useAuthFlowLogs';

// This hook is used for redirection based on auth state
// It no longer uses useAuth directly to avoid circular dependencies
export const useRedirection = (authState: {
  user: any;
  isLoading: boolean;
  profile: any;
  portalType: 'shop' | 'customer' | null;
  validateAccess: (roles?: any[]) => boolean;
}) => {
  const { 
    user, 
    isLoading, 
    profile, 
    portalType,
    validateAccess 
  } = authState;
  
  const navigate = useNavigate();
  const location = useLocation();
  const redirectionInProgress = useRef(false);
  const lastRedirectTime = useRef(0);
  const lastPath = useRef<string | null>(null);
  const { logAuthFlowEvent } = useAuthFlowLogs();

  useEffect(() => {
    // Skip redirection if still loading auth state
    if (isLoading) {
      console.log('🔄 Redirection: Loading auth state, skipping redirects');
      return;
    }
    
    // Skip redirection if no path change has occurred
    if (location.pathname === lastPath.current) {
      return;
    }
    
    // Update the last path reference
    lastPath.current = location.pathname;
    
    // Prevent redirect loops with minimum time between redirects
    const currentTime = Date.now();
    if (currentTime - lastRedirectTime.current < 250) { // Even shorter time to make login faster
      console.log('🛑 Too many redirects in a short period, preventing redirect loop');
      return;
    }
    
    // Track if the redirection logic is currently executing
    if (redirectionInProgress.current) {
      return;
    }
    
    // Check for auth pages
    const isAuthPage = 
      location.pathname === '/shop-login' ||
      location.pathname === '/customer-login';
      
    try {
      redirectionInProgress.current = true;
      
      console.group('🔀 Redirection Logic');
      console.log('Current path:', location.pathname);
      console.log('Is auth page:', isAuthPage);
      console.log('User authenticated:', !!user);
      console.log('Portal type:', portalType);
      console.log('Profile role:', profile?.role);
      
      // PRIORITY: If user is authenticated on an auth page, redirect to proper portal
      if (user && isAuthPage) {
        let redirectPath = '/';
        
        // If we have portal type information, use it for precise redirection
        if (portalType === 'shop') {
          redirectPath = '/shop';
          console.log('Detected shop user on login page, redirecting to shop dashboard');
        } else if (portalType === 'customer') {
          redirectPath = '/customer';
          console.log('Detected customer user on login page, redirecting to customer dashboard');
        }
        
        console.log(`➡️ Redirecting to ${redirectPath} (authenticated user on login page)`);
        
        lastRedirectTime.current = Date.now();
        navigate(redirectPath, { replace: true });
        logAuthFlowEvent('redirect', { from: location.pathname, to: redirectPath, reason: 'auth_page_authenticated' });
        console.groupEnd();
        return;
      }
      
      // Handle authenticated users on the index page
      if (user && location.pathname === '/' && portalType) {
        const redirectPath = portalType === 'customer' ? '/customer' : '/shop';
        console.log(`➡️ Redirecting to ${redirectPath} (authenticated user on index page)`);
        
        lastRedirectTime.current = Date.now();
        navigate(redirectPath, { replace: true });
        logAuthFlowEvent('redirect', { from: '/', to: redirectPath, reason: 'authenticated_on_index' });
        console.groupEnd();
        return;
      }
      
      // Check if authenticated user is accessing the wrong portal
      if (user && profile?.role && portalType) {
        const expectedPath = profile.role === 'customer' ? '/customer' : '/shop';
        const otherPortalPath = profile.role === 'customer' ? '/shop' : '/customer';
        
        if (location.pathname.startsWith(otherPortalPath)) {
          console.log(`➡️ Redirecting to ${expectedPath} (authenticated user in wrong portal)`);
          lastRedirectTime.current = Date.now();
          navigate(expectedPath, { replace: true });
          logAuthFlowEvent('redirect', { from: location.pathname, to: expectedPath, reason: 'wrong_portal_access' });
          console.groupEnd();
          return;
        }
      }
      
      // Handle unauthenticated users trying to access protected areas
      if (!user && !isAuthPage && location.pathname !== '/') {
        // If trying to access shop routes
        if (location.pathname.startsWith('/shop')) {
          console.log('➡️ Redirecting to /shop-login (unauthenticated on shop page)');
          lastRedirectTime.current = Date.now();
          navigate('/shop-login', { replace: true });
          logAuthFlowEvent('redirect', { from: location.pathname, to: '/shop-login', reason: 'unauthenticated_shop_access' });
          console.groupEnd();
          return;
        }
        
        // If trying to access customer routes
        if (location.pathname.startsWith('/customer')) {
          console.log('➡️ Redirecting to /customer-login (unauthenticated on customer page)');
          lastRedirectTime.current = Date.now();
          navigate('/customer-login', { replace: true });
          logAuthFlowEvent('redirect', { from: location.pathname, to: '/customer-login', reason: 'unauthenticated_customer_access' });
          console.groupEnd();
          return;
        }
        
        // Default fallback
        console.log('➡️ Redirecting to / (unauthenticated on protected page)');
        lastRedirectTime.current = Date.now();
        navigate('/', { replace: true });
        logAuthFlowEvent('redirect', { from: location.pathname, to: '/', reason: 'unauthenticated_protected_access' });
        console.groupEnd();
        return;
      }
      
      console.log('✅ No redirection needed');
      console.groupEnd();
    } finally {
      // Reset the redirection flag after a shorter delay
      setTimeout(() => {
        redirectionInProgress.current = false;
      }, 20); // Even shorter delay
    }
  }, [user, isLoading, navigate, location.pathname, portalType, profile, logAuthFlowEvent]);
};
