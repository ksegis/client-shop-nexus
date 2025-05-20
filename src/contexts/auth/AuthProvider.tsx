
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
      console.log('Checking for development user...');
      
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
        console.log('No development user found');
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
    signUp: async (email, password, metadata) => {
      console.log('Creating development user:', email);
      // Create a mock user object
      const devUser = {
        id: 'dev-' + Date.now(),
        email,
        user_metadata: {
          ...metadata,
          first_name: metadata?.first_name || '',
          last_name: metadata?.last_name || '',
          role: email === 'customer@example.com' ? 'admin' : (metadata?.role || 'customer')
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Store in localStorage
      localStorage.setItem('dev-customer-user', JSON.stringify(devUser));
      
      // Update state
      setUser(devUser);
      setIsAuthenticated(true);
      
      return { success: true, error: null };
    },
    signIn: async (email, password) => {
      console.log('Signing in development user:', email);
      
      // Create a mock user object
      const devUser = {
        id: 'dev-' + Date.now(),
        email,
        user_metadata: {
          first_name: 'Dev',
          last_name: 'User',
          role: email === 'customer@example.com' ? 'admin' : 'customer'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Store in localStorage
      localStorage.setItem('dev-customer-user', JSON.stringify(devUser));
      
      // Update state
      setUser(devUser);
      setIsAuthenticated(true);
      
      return { success: true, error: null };
    },
    signOut: async () => {
      console.log('Signing out development user');
      // Clear development user
      localStorage.removeItem('dev-customer-user');
      setUser(null);
      setIsAuthenticated(false);
      return { success: true, error: null };
    },
    resetPassword: async () => ({ success: true, error: null }),
    updatePassword: async () => ({ success: true, error: null }),
    updateProfile: async () => ({ success: true, error: null }),
    validateAccess: () => isAuthenticated,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
