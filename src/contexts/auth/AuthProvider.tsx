
import { ReactNode, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check for development user on mount and on localStorage changes
  useEffect(() => {
    const checkForDevUser = () => {
      // Check if we have a dev user in localStorage
      const devUserString = localStorage.getItem('dev-customer-user');
      
      if (devUserString) {
        try {
          const devUser = JSON.parse(devUserString);
          
          // If this is the dev customer@example.com user, ensure they have admin privileges
          if (devUser.email === 'customer@example.com' && devUser.user_metadata) {
            devUser.user_metadata.role = 'admin';
            // Update localStorage with the modified user
            localStorage.setItem('dev-customer-user', JSON.stringify(devUser));
          }
          
          setUser(devUser);
          setIsAuthenticated(true);
          console.log('Development user detected:', devUser.email);
        } catch (error) {
          console.error('Error parsing development user:', error);
          // Clear invalid dev user data
          localStorage.removeItem('dev-customer-user');
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        // No dev user found
        setUser(null);
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };
    
    // Check immediately on mount
    checkForDevUser();
    
    // Listen for storage changes (in case another tab updates the auth)
    window.addEventListener('storage', checkForDevUser);
    
    return () => {
      window.removeEventListener('storage', checkForDevUser);
    };
  }, []);
  
  // Create simplified auth context value with development authentication
  const value = {
    user,
    profile: user ? {
      id: user?.id,
      email: user?.email,
      first_name: user?.user_metadata?.first_name || '',
      last_name: user?.user_metadata?.last_name || '',
      phone: user?.user_metadata?.phone || '',
      role: user?.email === 'customer@example.com' ? 'admin' : (user?.user_metadata?.role || 'customer'),
      created_at: user?.created_at,
      updated_at: user?.created_at,
    } : null,
    portalType: user?.user_metadata?.role || null,
    session: user ? { user } : null,
    isLoading,
    isAuthenticated,
    signUp: async () => ({ success: true }),
    signIn: async () => ({ success: true }),
    signOut: async () => {
      // Clear development user
      localStorage.removeItem('dev-customer-user');
      setUser(null);
      setIsAuthenticated(false);
      return { success: true };
    },
    resetPassword: async () => ({ success: true }),
    updatePassword: async () => ({ success: true }),
    updateProfile: async () => ({ success: true }),
    validateAccess: () => isAuthenticated,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
