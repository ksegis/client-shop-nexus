
import React, { ReactNode, useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { AuthContextType, UserRole, isTestRole, getBaseRole, UserProfile, getPortalByRole } from './types';
import { useAuthStateListener } from './hooks/useAuthStateListener';
import { useProfileManagement } from './hooks/useProfileManagement';
import { useTestUsers } from './hooks/useTestUsers';
import { useIframeAuth } from './hooks/useIframeAuth';
import { useAuthActions } from './hooks/useAuthActions';
import { useAuthLogging } from './hooks/useAuthLogging';

export function AuthProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user: authUser, session, loading: authLoading } = useAuthStateListener();
  const { profile: authProfile, setProfile } = useProfileManagement(authUser);
  const { iframeAuth, isInIframe } = useIframeAuth();
  const { testMode, testUsers, testProfiles, impersonateTestUser, stopImpersonation, getTestUserByRole } = useTestUsers();
  const { logAuthEvent } = useAuthLogging();
  
  const [loading, setLoading] = useState<boolean>(true);
  
  // Determine whether we're in dev mode
  const isDevMode = useMemo(() => {
    return process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
  }, []);

  // Select the appropriate user and profile based on various states
  const [testRole, setTestRole] = useState<UserRole | null>(() => {
    // Check for persisted test role
    const savedRole = localStorage.getItem('test-user-mode') as UserRole | null;
    return savedRole && isTestRole(savedRole) ? savedRole : null;
  });
  
  // Generate actual user and profile based on auth state
  const { user, profile, portalType } = useMemo(() => {
    // If we're in test mode
    if (testRole) {
      const testData = getTestUserByRole(testRole);
      return { 
        user: testData.user, 
        profile: testData.profile,
        portalType: getPortalByRole(testRole)
      };
    }
    
    // If we're authenticated via iframe
    if (isInIframe && iframeAuth.enabled && iframeAuth.user) {
      return { 
        user: iframeAuth.user, 
        profile: iframeAuth.profile,
        portalType: 'shop' as 'shop' | 'customer' // Explicitly type as 'shop'
      };
    }
    
    // Regular authentication
    return { 
      user: authUser, 
      profile: authProfile,
      portalType: authUser ? 
        (authUser.user_metadata?.role?.includes('customer') ? 'customer' : 'shop') as 'shop' | 'customer' : 
        null
    };
  }, [authUser, authProfile, testRole, isInIframe, iframeAuth]);

  // Determine if current user is a test user
  const isTestUser = useMemo(() => {
    if (!user || !profile) return false;
    return isTestRole(profile.role as UserRole) || !!profile.is_test_account;
  }, [user, profile]);
  
  const {
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    getRedirectPathByRole,
  } = useAuthActions();

  // Handle test user impersonation
  const handleImpersonateTestUser = (role: UserRole) => {
    if (!isTestRole(role)) {
      console.error('Not a valid test role:', role);
      return;
    }
    
    // Log impersonation start
    if (authUser) {
      logAuthEvent('impersonation_start', authUser, {
        impersonated_role: role
      });
    }
    
    // Switch to test user
    setTestRole(role);
    const testData = impersonateTestUser(role, authUser, authProfile);
    
    return testData;
  };
  
  // Handle ending test user impersonation
  const handleStopImpersonation = () => {
    // Log impersonation end
    if (authUser && testRole) {
      logAuthEvent('impersonation_end', authUser, {
        impersonated_role: testRole
      });
    }
    
    setTestRole(null);
    return stopImpersonation();
  };
  
  // Function to validate if user has access based on allowed roles
  const validateAccess = (allowedRoles: UserRole[]) => {
    if (!profile || !profile.role) return false;
    
    // Convert role to proper format
    const userRole = profile.role as UserRole;
    
    // Check direct role match
    if (allowedRoles.includes(userRole)) return true;
    
    // Check base role match (ignoring test_ prefix)
    const baseRole = getBaseRole(userRole);
    return allowedRoles.includes(baseRole as UserRole);
  };

  // Set up automatic authentication for development
  useEffect(() => {
    const initializeAuth = async () => {
      // Initialize auth state
      if (!authUser && !iframeAuth.user && !testRole) {
        console.log('No authenticated user found');
      }
      
      setLoading(false);
    };
    
    if (!authLoading) {
      initializeAuth();
    }
  }, [authLoading, authUser, iframeAuth, testRole]);

  // Context value that matches AuthContextType
  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading: loading || authLoading,
    isAuthenticated: !!user,
    isTestUser,
    portalType,
    isDevMode,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    getRedirectPathByRole,
    impersonateTestUser: handleImpersonateTestUser,
    stopImpersonation: handleStopImpersonation,
    validateAccess
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
