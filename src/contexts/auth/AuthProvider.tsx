
import { ReactNode, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Auto-login as customer@example.com on mount
  useEffect(() => {
    const autoLogin = async () => {
      console.log('Auto-logging in as customer@example.com...');
      
      // Create a mock admin user
      const devUser = {
        id: 'dev-' + Date.now(),
        email: 'customer@example.com',
        user_metadata: {
          first_name: 'Dev',
          last_name: 'Admin',
          role: 'admin',
          phone: '555-1234'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Store in localStorage
      localStorage.setItem('dev-customer-user', JSON.stringify(devUser));
      
      // Update state
      setUser(devUser);
      setIsAuthenticated(true);
      setIsLoading(false);
      
      // Show toast notification
      toast({
        title: "Auto-login successful",
        description: "Logged in as customer@example.com with admin privileges",
      });
      
      // Redirect to dashboard if on login page
      const currentPath = window.location.pathname;
      if (currentPath.includes('login')) {
        setTimeout(() => {
          navigate('/shop/dashboard', { replace: true });
        }, 500);
      }
    };
    
    // Execute auto-login
    autoLogin();
    
    // Clean up function
    return () => {
      // Nothing to clean up for now
    };
  }, [navigate, toast]);
  
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
