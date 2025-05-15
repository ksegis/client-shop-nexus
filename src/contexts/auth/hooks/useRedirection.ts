import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../useAuth';
import { useAuthFlowLogs } from '@/hooks/useAuthFlowLogs';

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
  const redirectionInProgress = useRef(false);
  const lastRedirectTime = useRef(0);
  const lastPath = useRef<string | null>(null);
  const { logAuthFlowEvent } = useAuthFlowLogs();

  useEffect(() => {
    // Skip redirection if no path change has occurred
    if (location.pathname === lastPath.current) {
      return;
    }
    
    // Update the last path reference
    lastPath.current = location.pathname;
    
    // Prevent redirect loops by enforcing minimum time between redirects
    // Increased from 3000ms to 5000ms
    const currentTime = Date.now();
    if (currentTime - lastRedirectTime.current < 5000) {
      logAuthFlowEvent({
        event_type: 'redirect_prevented_throttle',
        user_id: user?.id,
        email: user?.email,
        user_role: profile?.role,
        route_path: location.pathname,
        details: {
          timeSinceLastRedirect: currentTime - lastRedirectTime.current,
          threshold: 5000
        }
      });
      console.log('🛑 Too many redirects in a short period, preventing redirect loop');
      return;
    }
    
    // Track if the redirection logic is currently executing to prevent double redirects
    if (redirectionInProgress.current) {
      return;
    }
    
    // CRITICAL: Skip redirection logic entirely when still loading OR when profile/portalType isn't determined yet
    if (isLoading || (user && (!profile || !portalType))) {
      logAuthFlowEvent({
        event_type: 'redirection_skipped_loading',
        user_id: user?.id,
        email: user?.email,
        route_path: location.pathname,
        details: {
          isLoading,
          hasUser: !!user,
          hasProfile: !!profile,
          hasPortalType: !!portalType,
          currentPath: location.pathname
        }
      });
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
    
    try {
      redirectionInProgress.current = true;
      
      // Case 1: Not authenticated trying to access protected page
      if (!user && !isAuthPage) {
        logAuthFlowEvent({
          event_type: 'redirect_unauthenticated',
          route_path: currentPath,
          details: {
            redirectTo: "/auth",
            from: currentPath,
            isAuthPage 
          }
        });
        
        console.log('➡️ Redirecting to /auth (not authenticated on protected page)');
        lastRedirectTime.current = Date.now();
        navigate('/auth', { 
          replace: true,
          state: { from: currentPath } 
        });
        console.groupEnd();
        return;
      } 
      
      // Case 2: Authenticated on auth page - redirect to appropriate portal 
      // ONLY if we have determined the portalType AND profile - this is critical to prevent loops
      if (user && isAuthPage && portalType && profile) {
        const redirectPath = portalType === 'customer' ? '/customer' : '/shop';
        
        logAuthFlowEvent({
          event_type: 'redirect_authenticated_from_auth',
          user_id: user?.id,
          email: user?.email, 
          user_role: profile?.role,
          route_path: currentPath,
          portal_type: portalType,
          details: {
            redirectTo: redirectPath,
            isAuthPage,
            hasProfile: !!profile,
            hasPortalType: !!portalType
          }
        });
        
        console.log(`➡️ Redirecting to ${redirectPath} (authenticated on auth page, portalType: ${portalType})`);
        
        // Increased delay from 300ms to 1200ms
        setTimeout(() => {
          lastRedirectTime.current = Date.now();
          navigate(redirectPath, { replace: true });
          redirectionInProgress.current = false;
        }, 1200);
        
        console.groupEnd();
        return;
      } 
      
      // No redirection needed
      logAuthFlowEvent({
        event_type: 'no_redirection_needed',
        user_id: user?.id,
        email: user?.email,
        user_role: profile?.role,
        route_path: currentPath,
        portal_type: portalType,
        details: {
          isAuthPage,
          hasUser: !!user,
          hasProfile: !!profile,
          hasPortalType: !!portalType
        }
      });
      
      console.log('✅ No redirection needed');
    } finally {
      console.groupEnd();
      setTimeout(() => {
        redirectionInProgress.current = false;
      }, 500);
    }
  }, [user, isLoading, navigate, location.pathname, portalType, profile]);
};
