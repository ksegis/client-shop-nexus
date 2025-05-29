
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('=== AUTH CALLBACK DEBUG ===');
      console.log('Current URL:', window.location.href);
      console.log('Search params:', Object.fromEntries(searchParams.entries()));
      
      // Check for EGIS OAuth parameters first
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      
      // Check for Supabase recovery parameters
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      const redirectTo = searchParams.get('redirect_to');
      
      console.log('OAuth Code:', code);
      console.log('OAuth State:', state);
      console.log('Recovery Token:', token);
      console.log('Recovery Type:', type);
      console.log('Redirect to:', redirectTo);
      
      // Handle EGIS OAuth callback - only if we have BOTH code AND state
      if (code && state) {
        console.log('Processing EGIS OAuth callback...');
        // Redirect to the EGIS-specific callback handler
        navigate(`/auth/egis/callback?code=${code}&state=${state}`);
        return;
      }
      
      // Handle Supabase password recovery
      if (token && type === 'recovery') {
        console.log('Processing password recovery token...');
        
        // For password recovery, we need to sign out any existing user first
        // to allow the password reset flow to work properly
        console.log('Signing out existing user to allow password reset...');
        await supabase.auth.signOut();
        
        // Clear any local dev user data
        localStorage.removeItem('dev-customer-user');
        
        // Redirect to the reset password page with the token parameters
        const resetUrl = new URL('/auth/reset-password', window.location.origin);
        resetUrl.searchParams.set('token', token);
        resetUrl.searchParams.set('type', type);
        
        console.log('Redirecting to:', resetUrl.toString());
        window.location.href = resetUrl.toString();
        return;
      }
      
      // Handle other auth types or redirect to login if no valid params
      console.log('No valid authentication parameters found, redirecting to shop login');
      navigate('/shop-login');
    };
    
    handleAuthCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Processing authentication...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
