
import { ReactNode } from 'react';
import { AuthContext } from './AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Create simplified auth context value with no authentication
  const value = {
    user: null,
    profile: null,
    portalType: null,
    session: null,
    isLoading: false,
    isAuthenticated: false,
    signUp: async () => ({ success: true }),
    signIn: async () => ({ success: true }),
    signOut: async () => ({ success: true }),
    resetPassword: async () => ({ success: true }),
    updatePassword: async () => ({ success: true }),
    updateProfile: async () => ({ success: true }),
    validateAccess: () => true,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
