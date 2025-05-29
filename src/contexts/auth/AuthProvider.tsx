
import { ReactNode, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { getInvitationData, clearInvitationData } from '@/utils/invitationStorage';
import { supabase } from '@/integrations/supabase/client';

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
        // Clear any old dev user data that might have "Dev User" values
        const storedUser = localStorage.getItem('dev-customer-user');
        
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          
          // If the stored user has the old "Dev User" values, clear it
          if (parsedUser.user_metadata?.first_name === 'Dev' && 
              parsedUser.user_metadata?.last_name === 'User') {
            console.log('Clearing old dev user with "Dev User" values');
            localStorage.removeItem('dev-customer-user');
          } else {
            console.log('Found existing dev user:', parsedUser.email);
            setUser(parsedUser);
            setIsAuthenticated(true);
          }
        } else {
          console.log('No existing dev user found');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking existing user:', error);
        // Clear corrupted data
        localStorage.removeItem('dev-customer-user');
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
      
      // First check for invitation data
      const inviteData = getInvitationData(email);
      
      // If there's invitation data, use it
      if (inviteData) {
        const { role: userRole, firstName, lastName } = inviteData;
        console.log('Using invitation data for', email, '- Role:', userRole, 'Name:', firstName, lastName);
        
        // Clear the invitation data after use
        clearInvitationData(email);
        
        // Create a mock user object with the invitation data
        const devUser = {
          id: 'dev-' + Date.now(),
          email,
          user_metadata: {
            first_name: firstName,
            last_name: lastName,
            role: userRole
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        console.log('Created dev user object:', devUser);
        
        // Store in localStorage
        localStorage.setItem('dev-customer-user', JSON.stringify(devUser));
        
        // Update state
        setUser(devUser);
        setIsAuthenticated(true);
        
        toast({
          title: "Signed in successfully",
          description: `Logged in as ${firstName} ${lastName} (${userRole})`,
        });
        
        // Handle redirect based on user role
        let redirectPath = '/customer/dashboard'; // Default for customers
        
        if (userRole === 'admin' || userRole === 'staff') {
          redirectPath = '/shop/dashboard';
        }
        
        console.log(`Redirecting ${userRole} user ${email} to ${redirectPath}`);
        
        // Use setTimeout to ensure state updates complete before navigation
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 100);
        
        return { success: true, error: null };
      } else {
        // No invitation data - this might be a regular user or existing user
        // For development mode, we'll create a basic customer account with empty names
        console.log('No invitation data found, creating basic customer account for', email);
        
        const devUser = {
          id: 'dev-' + Date.now(),
          email,
          user_metadata: {
            first_name: '',
            last_name: '',
            role: 'customer'
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
        
        // Default to customer dashboard
        setTimeout(() => {
          navigate('/customer/dashboard', { replace: true });
        }, 100);
        
        return { success: true, error: null };
      }
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
    resetPassword: async (email) => {
      console.log('Password reset requested for:', email);
      
      try {
        // Use the callback route to handle the Supabase verification
        const redirectTo = `https://CTC.MODWORX.ONLINE/auth/callback`;
        console.log('Using redirect URL:', redirectTo);
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectTo
        });
        
        if (error) {
          console.error('Password reset error:', error);
          // Don't show the actual error for security
        }
        
        // Always show success message for security
        toast({
          title: "Password reset requested",
          description: "If your email address is registered with us, you will receive password reset instructions within a few minutes. Please check your inbox and spam folder."
        });
        
        return { success: true, error: null };
      } catch (error) {
        console.error('Password reset error:', error);
        
        // Still show success message for security
        toast({
          title: "Password reset requested",
          description: "If your email address is registered with us, you will receive password reset instructions within a few minutes. Please check your inbox and spam folder."
        });
        
        return { success: true, error: null };
      }
    },
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
