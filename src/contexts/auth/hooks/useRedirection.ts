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
    // Increased from 5000ms to 10000ms
    const currentTime = Date.now();
    if (currentTime - lastRedirectTime.current < 10000) {
      logAuthFlowEvent({
        event_type: 'redirect_prevented_throttle',
        user_id: user?.id,
        email: user?.email,
        user_role: profile?.role,
        route_path: location.pathname,
        details: {
          timeSinceLastRedirect: currentTime - lastRedirectTime.current,
          threshold: 10000
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

    // Check if we're on the index page or any auth-related pages
    const isAuthOrIndexPage = 
      location.pathname === '/' ||
      location.pathname === '/auth' || 
      location.pathname === '/shop-login' ||
      location.pathname === '/customer-login';
    
    // Keep track of the current path
    const currentPath = location.pathname;
    
    console.group('🔀 Redirection Logic');
    console.log('Current path:', currentPath);
    console.log('Is auth or index page:', isAuthOrIndexPage);
    console.log('User authenticated:', !!user);
    console.log('Portal type:', portalType);
    console.log('Profile:', profile);
    
    try {
      redirectionInProgress.current = true;
      
      // Case 1: Not authenticated trying to access protected page (not auth/login pages)
      if (!user && !isAuthOrIndexPage) {
        logAuthFlowEvent({
          event_type: 'redirect_unauthenticated',
          route_path: currentPath,
          details: {
            redirectTo: "/",
            from: currentPath,
            isAuthOrIndexPage
          }
        });
        
        console.log('➡️ Redirecting to / (not authenticated on protected page)');
        lastRedirectTime.current = Date.now();
        navigate('/', { 
          replace: true,
          state: { from: currentPath } 
        });
        console.groupEnd();
        return;
      } 
      
      // Case 2: Authenticated on auth page or index page - redirect to appropriate portal 
      // ONLY if we have determined the portalType AND profile
      if (user && isAuthOrIndexPage && portalType && profile) {
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
            isAuthOrIndexPage,
            hasProfile: !!profile,
            hasPortalType: !!portalType
          }
        });
        
        console.log(`➡️ Redirecting to ${redirectPath} (authenticated on auth/index page, portalType: ${portalType})`);
        
        // We don't need a long delay here as we're not changing auth state
        setTimeout(() => {
          lastRedirectTime.current = Date.now();
          navigate(redirectPath, { replace: true });
          redirectionInProgress.current = false;
        }, 100);
        
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
          isAuthOrIndexPage,
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
      }, 1000);
    }
  }, [user, isLoading, navigate, location.pathname, portalType, profile]);
};
