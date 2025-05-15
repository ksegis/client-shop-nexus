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
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const isDevMode = process.env.NODE_ENV === 'development';

  // Load profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setProfileLoading(false);
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
          setProfileLoading(false);
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
          // If there's a network error, don't clear the profile - this might cause redirect loops
          if (profileError.code === 'PGRST116') {
            console.log('Network error when fetching profile - keeping current auth state');
            setProfileLoading(false);
            return;
          }
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
          console.log('Profile loaded:', userProfile.role, 'Portal type:', getPortalByRole(profileData.role));
        } else if (user) {
          // If no profile exists but we have a user, create a default one
          // This prevents redirect loops caused by auth state being inconsistent
          console.log('No profile found, creating default profile with user metadata');
          const role = (user.user_metadata?.role as UserRole) || 'customer';
          
          const newUserProfile: UserProfile = {
            id: user.id,
            email: user.email || '',
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            role: role,
            is_test_account: false
          };
          
          setProfile(newUserProfile);
          setIsAuthenticated(true);
          setIsTestUser(false);
          setPortalType(getPortalByRole(role));
          
          console.warn('Created default profile for authenticated user');
          
          // Also create the profile in the database - but convert test roles to base roles for DB compatibility
          try {
            let dbRole = role;
            // Convert test roles to their base roles for database compatibility
            if (role.startsWith('test_')) {
              dbRole = role.replace('test_', '') as 'admin' | 'staff' | 'customer';
            }
            
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email,
                first_name: user.user_metadata?.first_name || '',
                last_name: user.user_metadata?.last_name || '',
                role: dbRole
              });
              
            if (insertError) {
              console.error('Failed to create profile in database:', insertError);
            } else {
              console.log('Created profile in database');
            }
          } catch (insertErr) {
            console.error('Error creating profile:', insertErr);
          }
        }
      } catch (error) {
        console.error('Error processing profile data:', error);
        // If we encounter a fatal error, clear auth state to prevent redirect loops
        if (error instanceof Error && error.message.includes('Failed to fetch')) {
          console.warn('Fatal error fetching profile - clearing auth state to prevent redirect loop');
          setProfile(null);
          setIsAuthenticated(false);
        }
      } finally {
        setProfileLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    } else {
      setProfileLoading(false);
    }
  }, [user, session]);

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
    
    // For admin users, grant access to staff resources too
    if ((userRole === 'admin' || userRole === 'test_admin') && 
        (allowedRoles.includes('staff') || allowedRoles.includes('test_staff'))) {
      return true;
    }
    
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
    isLoading: loading || profileLoading, // Consider profile loading as part of overall loading
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
