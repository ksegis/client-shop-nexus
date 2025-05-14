
import { useState, useEffect, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { UserProfile, UserRole, isTestRole } from '../types';
import { toast } from '@/hooks/use-toast';

export function useTestUsers() {
  const [testMode, setTestMode] = useState<boolean>(false);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null);
  
  // Define mock test users for different roles
  const testUsers = useMemo(() => ({
    test_customer: {
      id: 'test-customer-user-id',
      email: 'test.customer@example.com',
      app_metadata: {
        role: 'test_customer'
      },
      user_metadata: {
        first_name: 'Test',
        last_name: 'Customer',
        phone: '555-1234',
        role: 'test_customer'
      },
      aud: 'authenticated',
      created_at: new Date().toISOString()
    } as User,
    
    test_staff: {
      id: 'test-staff-user-id',
      email: 'test.staff@example.com',
      app_metadata: {
        role: 'test_staff'
      },
      user_metadata: {
        first_name: 'Test',
        last_name: 'Staff',
        phone: '555-5678',
        role: 'test_staff'
      },
      aud: 'authenticated',
      created_at: new Date().toISOString()
    } as User,
    
    test_admin: {
      id: 'test-admin-user-id',
      email: 'test.admin@example.com',
      app_metadata: {
        role: 'test_admin'
      },
      user_metadata: {
        first_name: 'Test',
        last_name: 'Admin',
        phone: '555-9012',
        role: 'test_admin'
      },
      aud: 'authenticated',
      created_at: new Date().toISOString()
    } as User
  }), []);

  // Create corresponding test profiles
  const testProfiles = useMemo(() => ({
    test_customer: {
      id: testUsers.test_customer.id,
      email: testUsers.test_customer.email || '',
      first_name: testUsers.test_customer.user_metadata?.first_name || '',
      last_name: testUsers.test_customer.user_metadata?.last_name || '',
      role: 'test_customer',
      is_test_account: true
    } as UserProfile,
    
    test_staff: {
      id: testUsers.test_staff.id,
      email: testUsers.test_staff.email || '',
      first_name: testUsers.test_staff.user_metadata?.first_name || '',
      last_name: testUsers.test_staff.user_metadata?.last_name || '',
      role: 'test_staff',
      is_test_account: true
    } as UserProfile,
    
    test_admin: {
      id: testUsers.test_admin.id,
      email: testUsers.test_admin.email || '',
      first_name: testUsers.test_admin.user_metadata?.first_name || '',
      last_name: testUsers.test_admin.user_metadata?.last_name || '',
      role: 'test_admin',
      is_test_account: true
    } as UserProfile
  }), [testUsers]);
  
  // Start impersonating a test user
  const impersonateTestUser = (role: UserRole, currentUser?: User, currentProfile?: UserProfile) => {
    if (!role.startsWith('test_')) {
      console.error('Not a valid test role:', role);
      return null;
    }
    
    const roleKey = role as keyof typeof testUsers;
    
    // Save original user if not already in test mode
    if (!testMode && currentUser) {
      setOriginalUser(currentUser);
      setOriginalProfile(currentProfile || null);
    }
    
    setTestMode(true);
    
    // Store test user in localStorage for persistence
    localStorage.setItem('test-user-mode', role);
    
    toast({
      title: "Test Mode Activated",
      description: `You are now using a test ${role.replace('test_', '')} account.`,
      variant: "default",
    });
    
    return {
      user: testUsers[roleKey],
      profile: testProfiles[roleKey]
    };
  };
  
  // Stop impersonating a test user
  const stopImpersonation = () => {
    if (!testMode) return null;
    
    setTestMode(false);
    localStorage.removeItem('test-user-mode');
    
    toast({
      title: "Test Mode Deactivated",
      description: "You have returned to your original account.",
      variant: "default",
    });
    
    return {
      user: originalUser,
      profile: originalProfile
    };
  };
  
  // Check for persisted test mode on load
  useEffect(() => {
    const persistedTestRole = localStorage.getItem('test-user-mode') as UserRole | null;
    
    if (persistedTestRole && isTestRole(persistedTestRole)) {
      setTestMode(true);
    }
  }, []);
  
  return {
    testMode,
    testUsers,
    testProfiles,
    impersonateTestUser,
    stopImpersonation,
    getTestUserByRole: (role: UserRole) => {
      const roleKey = role as keyof typeof testUsers;
      return {
        user: testUsers[roleKey],
        profile: testProfiles[roleKey]
      };
    }
  };
}
