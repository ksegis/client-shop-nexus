
import React, { ReactNode } from 'react';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  // Mock user with all required properties
  const mockUser = {
    id: 'mock-user-id',
    email: 'user@example.com',
    app_metadata: {
      role: 'customer' // Default role
    },
    user_metadata: {
      first_name: 'Test',
      last_name: 'User',
      phone: '555-1234',
      role: 'customer'
    }
  };

  // Mock context with simplified authentication
  const value = {
    user: mockUser,
    session: null,
    signUp: async () => {},
    signIn: async () => {},
    signOut: async () => {},
    loading: false,
    getRedirectPathByRole: () => '/',
    updateUserWithRole: undefined
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
