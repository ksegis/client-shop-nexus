import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { AuthContextType, UserProfile, UserRole } from './types';
import { useAuthStateListener } from './hooks/useAuthStateListener';
import { useAuthActions } from './hooks/useAuthActions';
import { useAuthLogging } from './hooks/useAuthLogging';
import { getPortalByRole, isTestRole } from './types';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user, session, loading } = useAuthStateListener();
  const { 
    signUp, 
    signIn, 
    signOut, 
    resetPassword, 
    updatePassword,
    getRedirectPathByRole
  } = useAuthActions();
  const { logAuthEvent } = useAuthLogging();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isTestUser, setIsTestUser] = useState<boolean>(false);
  const [portalType, setPortalType] = useState<'shop' | 'customer' | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const isDevMode = process.env.NODE_ENV === 'development';

  // Load profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        return;
      }
      
      // Check if we're in test user mode
      const testUserMode = localStorage.getItem('test-user-mode');
      if (testUserMode) {
        try {
          const testUser = JSON.parse(testUserMode);
          console.log('Test user mode active:', testUser.email);
          
          setProfile({
            id: testUser.id,
            email: testUser.email,
            first_name: testUser.user_metadata?.first_name || 'Test',
            last_name: testUser.user_metadata?.last_name || 'User',
            role: testUser.user_metadata?.role || 'customer',
            avatar_url: testUser.user_metadata?.avatar_url,
            is_test_account: true
          });
          setIsAuthenticated(true);
          setIsTestUser(true);
          setPortalType(getPortalByRole(testUser.user_metadata?.role || 'customer'));
          return;
        } catch (err) {
          console.error('Error parsing test user data:', err);
          localStorage.removeItem('test-user-mode');
          window.location.reload();
          return;
        }
      }

      // Fetch profile from database
      try {
        console.log('Checking profile for user:', user.id);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          // Handle error appropriately, maybe set a default profile or display an error message
        }

        if (profileData) {
          const userProfile: UserProfile = {
            id: profileData.id,
            email: profileData.email,
            first_name: profileData.first_name || '',
            last_name: profileData.last_name || '',
            role: profileData.role || 'customer',
            avatar_url: profileData.avatar_url,
            is_test_account: false
          };
          
          setProfile(userProfile);
          setIsAuthenticated(true);
          setIsTestUser(isTestRole(profileData.role));
          setPortalType(getPortalByRole(profileData.role));
        } else {
          // If no profile exists, create a default one
          const newUserProfile: UserProfile = {
            id: user.id,
            email: user.email || '',
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            role: (user.user_metadata?.role as UserRole) || 'customer',
            is_test_account: false
          };
          
          setProfile(newUserProfile);
          setIsAuthenticated(true);
          setIsTestUser(false);
          setPortalType('customer'); // Default to customer portal
          
          console.warn('No profile found, consider creating a default profile.');
        }
      } catch (error) {
        console.error('Error processing profile data:', error);
      }
    };

    fetchProfile();
  }, [user, session, location.pathname, navigate, toast]);

  // Update auth state
  useEffect(() => {
    setIsAuthenticated(!!user);
    
    if (!user) {
      setProfile(null);
      setPortalType(null);
      setIsTestUser(false);
    }
  }, [user]);
  
  // Test user mode functions
  const impersonateTestUser = (role: UserRole) => {
    if (!isDevMode) {
      console.warn('Impersonating test users is only allowed in development mode.');
      return;
    }
    
    const mockUser = {
      id: `00000000-0000-0000-0000-000000000001-${role}`,
      email: `${role}@example.com`,
      app_metadata: { role },
      user_metadata: {
        first_name: 'Test',
        last_name: role,
        role
      },
      aud: 'authenticated',
      created_at: new Date().toISOString()
    };
    
    console.log(`Switching to test user mode: ${role}`);
    localStorage.setItem('test-user-mode', JSON.stringify(mockUser));
    setIsTestUser(true);
    setPortalType(getPortalByRole(role));
    
    logAuthEvent('impersonate_test_user', mockUser as any, { role });
    window.location.reload();
  };
  
  const stopImpersonation = () => {
    console.log('Stopping test user mode');
    localStorage.removeItem('test-user-mode');
    setIsTestUser(false);
    setPortalType(null);
    logAuthEvent('stop_impersonation', user as any);
    window.location.reload();
  };

  const validateAccess = useCallback((allowedRoles: UserRole[]): boolean => {
    if (!profile?.role) {
      console.warn('validateAccess: User has no role.');
      return false;
    }

    const userRole = profile.role;
    const hasAccess = allowedRoles.includes(userRole);
    
    if (!hasAccess) {
      console.warn(`validateAccess: User role ${userRole} does not have access. Allowed roles: ${allowedRoles.join(', ')}`);
    }
    
    return hasAccess;
  }, [profile?.role]);

  const contextValue: AuthContextType = {
    user,
    profile,
    session,
    isLoading: loading,
    isAuthenticated,
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
