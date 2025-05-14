
import React, { ReactNode } from 'react';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  // Simplified context with no authentication
  const value = {
    user: null,
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
