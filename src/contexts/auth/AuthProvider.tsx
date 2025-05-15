
import React, { useCallback, useEffect, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { AuthContextType, UserRole } from './types';
import { useAuthStateListener } from './hooks/useAuthStateListener';
import { useAuthActions } from './hooks/useAuthActions';
import { useAuthLogging } from './hooks/useAuthLogging';
import { useProfileManagement } from './hooks/useProfileManagement';
import { useTestUsers } from './hooks/useTestUsers';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuthFlowLogs } from '@/hooks/useAuthFlowLogs';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const isInitialMount = useRef(true);
  const { user, session, loading: authLoading } = useAuthStateListener();
  const { 
    signUp, 
    signIn, 
    signOut, 
    resetPassword, 
    updatePassword,
    getRedirectPathByRole
  } = useAuthActions();
  const { logAuthEvent } = useAuthLogging();
  const { logAuthFlowEvent } = useAuthFlowLogs();
  
  const { 
    profile, 
    profileLoading, 
    isTestUser, 
    portalType 
  } = useProfileManagement(user);
  
  const { testUsers, impersonateTestUser, stopImpersonation } = useTestUsers();
  
  const location = useLocation();
  const { toast } = useToast();
  
  const isDevMode = process.env.NODE_ENV === 'development';

  // Log when the AuthProvider mounts/remounts
  useEffect(() => {
    if (isInitialMount.current) {
      console.log('🔑 AuthProvider mounted');
      
      // Log initial state
      logAuthFlowEvent({
        event_type: 'auth_provider_mounted',
        route_path: location.pathname,
        details: { initialMount: true }
      });
      
      isInitialMount.current = false;
    }
    return () => {
      console.log('🔑 AuthProvider unmounted');
      logAuthFlowEvent({
        event_type: 'auth_provider_unmounted',
        route_path: location.pathname
      });
    };
  }, []);
  
  // Log auth state changes
  useEffect(() => {
    // Log auth loading state
    logAuthFlowEvent({
      event_type: 'auth_loading_state',
      user_id: user?.id,
      email: user?.email,
      user_role: profile?.role,
      route_path: location.pathname,
      details: { 
        authLoading, 
        profileLoading,
        hasUser: !!user,
        hasProfile: !!profile,
        portalType
      }
    });
    
    // Log when auth state is fully loaded
    if (!authLoading && !profileLoading) {
      logAuthFlowEvent({
        event_type: 'auth_state_loaded',
        user_id: user?.id,
        email: user?.email,
        user_role: profile?.role,
        route_path: location.pathname,
        portal_type: portalType,
        details: { 
          isAuthenticated: !!user,
          isTestUser,
          portalDetermined: !!portalType
        }
      });
    }
  }, [authLoading, profileLoading, user, profile, portalType, location.pathname]);
  
  // Helper functions for validating user access
  const validateAccess = useCallback((allowedRoles: UserRole[]): boolean => {
    if (!profile?.role) {
      logAuthFlowEvent({
        event_type: 'access_check_failed_no_role',
        user_id: user?.id,
        email: user?.email,
        route_path: location.pathname,
        required_roles: allowedRoles as string[],
        access_granted: false,
        details: { reason: 'No user role defined' }
      });
      
      return false;
    }

    const userRole = profile.role;
    
    // For admin users, grant access to staff resources too
    if ((userRole === 'admin' || userRole === 'test_admin') && 
        (allowedRoles.includes('staff') || allowedRoles.includes('test_staff'))) {
      
      logAuthFlowEvent({
        event_type: 'access_granted_admin_to_staff',
        user_id: user?.id,
        email: user?.email,
        user_role: userRole,
        route_path: location.pathname,
        required_roles: allowedRoles as string[],
        access_granted: true,
        portal_type: portalType
      });
      
      return true;
    }
    
    const hasAccess = allowedRoles.includes(userRole);
    
    logAuthFlowEvent({
      event_type: hasAccess ? 'access_granted' : 'access_denied',
      user_id: user?.id,
      email: user?.email,
      user_role: userRole,
      route_path: location.pathname,
      required_roles: allowedRoles as string[],
      access_granted: hasAccess,
      portal_type: portalType,
      details: { 
        userRole,
        allowedRoles
      }
    });
    
    return hasAccess;
  }, [profile?.role, user, location.pathname, portalType]);

  const contextValue: AuthContextType = {
    user,
    profile,
    session,
    isLoading: authLoading || profileLoading,
    isAuthenticated: !!user,
    isTestUser,
    portalType,
    signIn,
    signOut,
    signUp,
    resetPassword,
    updatePassword,
    getRedirectPathByRole,
    impersonateTestUser,
    stopImpersonation,
    validateAccess,
    isDevMode
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
