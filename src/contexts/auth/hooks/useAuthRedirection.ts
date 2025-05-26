
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '../types';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

export function useAuthRedirection() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const getRedirectPathByRole = (role: UserRole) => {
    console.log(`Determining redirect path for role: ${role}`);
    switch (role) {
      case 'customer':
        return '/customer/dashboard';
      case 'admin':
      case 'staff':
        return '/shop/dashboard';
      default:
        console.warn(`Unknown role: ${role}, defaulting to customer portal`);
        return '/customer/dashboard';
    }
  };

  const getPortalDisplayName = (role: UserRole) => {
    switch (role) {
      case 'customer':
        return 'customer';
      case 'admin':
      case 'staff':
        return 'shop management';
      default:
        return 'customer';
    }
  };

  const handlePostSignInRedirection = async (user: User) => {
    // Get user profile to determine redirect path - force a fresh fetch
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role, force_password_change, email')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      toast({
        variant: "destructive",
        title: "Login error",
        description: "Could not retrieve user profile"
      });
      throw profileError;
    }
    
    if (profileData) {
      console.log(`Profile data fetched for ${profileData.email}:`, {
        role: profileData.role,
        force_password_change: profileData.force_password_change
      });
      
      // Check if password change is required
      if (profileData.force_password_change) {
        console.log('Password change required, redirecting to change-password page');
        
        toast({
          title: "Password change required",
          description: "Please change your password to continue"
        });
        
        // Add delay before navigation to ensure toast is shown
        setTimeout(() => {
          console.log('Navigating to change-password page');
          navigate('/auth/change-password', { replace: true });
        }, 500);
        
        return;
      }
      
      // Log the detected role and intended redirect path
      const redirectPath = getRedirectPathByRole(profileData.role as UserRole);
      console.log(`User ${profileData.email} has role: ${profileData.role}, redirecting to: ${redirectPath}`);
      
      // Show success toast
      toast({
        title: "Login successful",
        description: `Welcome to your ${getPortalDisplayName(profileData.role as UserRole)} portal!`
      });
      
      // Add debug logging
      console.log(`Preparing to navigate to ${redirectPath}`);
      
      // Use consistent navigation approach with delay to ensure toast is shown
      setTimeout(() => {
        console.log(`Executing navigation to ${redirectPath} for user with role ${profileData.role}`);
        navigate(redirectPath, { replace: true });
      }, 500);
    } else {
      console.error('No profile data found for user');
      toast({
        variant: "destructive",
        title: "Login error",
        description: "User profile not found"
      });
      throw new Error('No profile found for user');
    }
  };

  return {
    getRedirectPathByRole,
    getPortalDisplayName,
    handlePostSignInRedirection
  };
}
