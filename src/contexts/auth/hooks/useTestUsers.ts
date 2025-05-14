
import { useState, useCallback, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { UserProfile, UserRole } from '../types';

export function useTestUsers() {
  // Using UUIDs for test user IDs to avoid Supabase errors
  const testUserIds = useMemo(() => ({
    test_customer: '00000000-0000-0000-0000-000000000001',
    test_staff: '00000000-0000-0000-0000-000000000002',
    test_admin: '00000000-0000-0000-0000-000000000003',
  }), []);
  
  // Define all useState hooks first
  const [testMode, setTestMode] = useState<boolean>(false);
  const [activeTestRole, setActiveTestRole] = useState<UserRole | null>(null);
  
  // Store original user info when test mode is activated
  const [originalUser, setOriginalUser] = useState<{
    user: User | null;
    profile: UserProfile | null;
  } | null>(null);

  // Define test users using useMemo to avoid recreation
  const testUsers = useMemo(() => {
    const users: Record<UserRole, { user: User; profile: UserProfile }> = {
      test_customer: {
        user: {
          id: testUserIds.test_customer,
          app_metadata: { role: 'test_customer' },
          user_metadata: { 
            role: 'test_customer',
            first_name: 'Test',
            last_name: 'Customer'
          },
          aud: 'authenticated',
          email: 'test.customer@example.com',
          created_at: new Date().toISOString(),
        } as User,
        profile: {
          id: testUserIds.test_customer,
          email: 'test.customer@example.com',
          first_name: 'Test',
          last_name: 'Customer',
          role: 'test_customer',
          is_test_account: true
        }
      },
      test_staff: {
        user: {
          id: testUserIds.test_staff,
          app_metadata: { role: 'test_staff' },
          user_metadata: { 
            role: 'test_staff',
            first_name: 'Test',
            last_name: 'Staff'
          },
          aud: 'authenticated',
          email: 'test.staff@example.com',
          created_at: new Date().toISOString(),
        } as User,
        profile: {
          id: testUserIds.test_staff,
          email: 'test.staff@example.com',
          first_name: 'Test',
          last_name: 'Staff',
          role: 'test_staff',
          is_test_account: true
        }
      },
      test_admin: {
        user: {
          id: testUserIds.test_admin,
          app_metadata: { role: 'test_admin' },
          user_metadata: { 
            role: 'test_admin',
            first_name: 'Test',
            last_name: 'Admin'
          },
          aud: 'authenticated',
          email: 'test.admin@example.com',
          created_at: new Date().toISOString(),
        } as User,
        profile: {
          id: testUserIds.test_admin,
          email: 'test.admin@example.com',
          first_name: 'Test',
          last_name: 'Admin',
          role: 'test_admin',
          is_test_account: true
        }
      },
      staff: {
        user: {} as User,
        profile: {} as UserProfile
      },
      admin: {
        user: {} as User,
        profile: {} as UserProfile
      },
      customer: {
        user: {} as User,
        profile: {} as UserProfile
      }
    };
    
    return users;
  }, [testUserIds]);
  
  // Define callback functions after state hooks
  const impersonateTestUser = useCallback((
    role: UserRole, 
    currentUser?: User | null,
    currentProfile?: UserProfile | null
  ) => {
    if (!role.startsWith('test_')) {
      console.error('Cannot impersonate non-test role:', role);
      return null;
    }
    
    // Store current user details if provided
    if (currentUser && !originalUser) {
      setOriginalUser({ 
        user: currentUser, 
        profile: currentProfile || null 
      });
    }
    
    // Set test mode state
    setTestMode(true);
    setActiveTestRole(role);
    
    // Save to localStorage to persist across refreshes
    localStorage.setItem('test-user-mode', role);
    
    return testUsers[role];
  }, [originalUser, testUsers]);
  
  const stopImpersonation = useCallback(() => {
    localStorage.removeItem('test-user-mode');
    setTestMode(false);
    setActiveTestRole(null);
    return originalUser;
  }, [originalUser]);
  
  const getTestUserByRole = useCallback((role: UserRole) => {
    return testUsers[role];
  }, [testUsers]);

  return {
    testMode,
    testUsers,
    testProfiles: Object.values(testUsers).map(t => t.profile),
    impersonateTestUser,
    stopImpersonation,
    getTestUserByRole,
    activeTestRole
  };
}
