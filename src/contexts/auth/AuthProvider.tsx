
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
  
  // Check for existing dev user on mount, but don't auto-login
  useEffect(() => {
    const checkExistingUser = async () => {
      try {
        // Check if there's already a dev user stored
        const storedUser = localStorage.getItem('dev-customer-user');
        
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log('Found existing dev user:', parsedUser.email);
          
          // Set the user without forcing login
          setUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          console.log('No existing dev user found');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking existing user:', error);
        setIsLoading(false);
      }
    };
    
    checkExistingUser();
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
      role: user?.user_metadata?.role || 'customer',
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
          role: metadata?.role || 'customer'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Store in localStorage
      localStorage.setItem('dev-customer-user', JSON.stringify(devUser));
      
      // Update state
      setUser(devUser);
      setIsAuthenticated(true);
      
      toast({
        title: "Account created",
        description: `Development account created for ${email}`,
      });
      
      return { success: true, error: null };
    },
    signIn: async (email, password) => {
      console.log('Signing in development user:', email);
      
      // Determine role based on email - kevin.shelton@egisdynamics.com should be admin
      let userRole = 'customer'; // default
      if (email === 'kevin.shelton@egisdynamics.com') {
        userRole = 'admin';
      } else if (email === 'customer@example.com') {
        userRole = 'admin';
      } else if (email.includes('admin') || email.includes('staff')) {
        userRole = 'admin';
      }
      
      // Create a mock user object
      const devUser = {
        id: 'dev-' + Date.now(),
        email,
        user_metadata: {
          first_name: userRole === 'admin' ? 'Kevin' : 'Dev',
          last_name: userRole === 'admin' ? 'Shelton' : 'User',
          role: userRole
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Store in localStorage
      localStorage.setItem('dev-customer-user', JSON.stringify(devUser));
      
      // Update state
      setUser(devUser);
      setIsAuthenticated(true);
      
      toast({
        title: "Signed in successfully",
        description: `Logged in as ${email}`,
      });
      
      // Handle redirect based on user role
      let redirectPath = '/shop/dashboard'; // Default to shop dashboard
      
      if (userRole === 'customer') {
        redirectPath = '/customer/dashboard';
      } else if (userRole === 'admin' || userRole === 'staff') {
        redirectPath = '/shop/dashboard';
      }
      
      console.log(`Redirecting ${userRole} user ${email} to ${redirectPath}`);
      
      // Use setTimeout to ensure state updates complete before navigation
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 100);
      
      return { success: true, error: null };
    },
    signOut: async () => {
      console.log('Signing out development user');
      // Clear development user
      localStorage.removeItem('dev-customer-user');
      setUser(null);
      setIsAuthenticated(false);
      
      toast({
        title: "Signed out",
        description: "You have been logged out",
      });
      
      // Redirect to home page after logout
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
      
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
