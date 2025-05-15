
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';

/**
 * A diagnostic hook to help troubleshoot authentication and authorization issues.
 * This can be temporarily added to components to log relevant information.
 */
export const useAuthDiagnostics = (componentName: string = 'Unknown') => {
  const { 
    user, 
    profile, 
    isLoading, 
    portalType,
    validateAccess 
  } = useAuth();
  const location = useLocation();

  // Log authentication state on mount and when auth changes
  useEffect(() => {
    console.group(`🔍 Auth Diagnostics: ${componentName}`);
    console.log('Current path:', location.pathname);
    console.log('Auth loading:', isLoading);
    console.log('Is authenticated:', !!user);
    console.log('Portal type:', portalType);
    
    // Check user data sources
    if (user) {
      console.log('User ID:', user.id);
      console.log('User metadata role:', user.user_metadata?.role);
      console.log('User app metadata role:', user.app_metadata?.role);
    } else {
      console.log('User: null');
    }
    
    // Check profile data
    if (profile) {
      console.log('Profile ID:', profile.id);
      console.log('Profile role:', profile.role);
    } else {
      console.log('Profile: null');
    }
    
    // Test access to different roles
    if (user && profile?.role) {
      console.log('Access to customer routes:', validateAccess(['customer']));
      console.log('Access to staff routes:', validateAccess(['staff']));
      console.log('Access to admin routes:', validateAccess(['admin']));
    }
    
    console.groupEnd();
  }, [user, profile, isLoading, location.pathname, portalType, validateAccess]);
  
  // Log navigation events
  useEffect(() => {
    console.log(`📍 Navigation: ${componentName} -> ${location.pathname}`);
  }, [location.pathname, componentName]);
  
  return null;
};
