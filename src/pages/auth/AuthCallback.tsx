
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('[Supabase Auth] Auth callback handler started');
      console.log('Current URL:', window.location.href);
      console.log('Search params:', Object.fromEntries(searchParams.entries()));
      
      // Immediately block any other auth system processing
      const currentUrl = new URL(window.location.href);
      
      // Check for Supabase auth callback parameters
      const error = searchParams.get('error');
      const errorCode = searchParams.get('error_code');
      const errorDescription = searchParams.get('error_description');
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      
      console.log('[Supabase Auth] Parameters detected:', { 
        error, errorCode, token: !!token, type, 
        accessToken: !!accessToken, refreshToken: !!refreshToken 
      });
      
      if (error || errorCode) {
        console.error('[Supabase Auth] Callback error:', { error, errorCode, errorDescription });
        navigate('/shop-login?error=' + encodeURIComponent(errorDescription || error || 'Authentication failed'));
        return;
      }
      
      // Handle password recovery flow - check for both token formats
      if (type === 'recovery') {
        console.log('[Supabase Auth] Password recovery flow detected');
        
        // Method 1: Try with token hash from email link
        if (token) {
          console.log('[Supabase Auth] Attempting token verification');
          try {
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'recovery'
            });
            
            if (verifyError) {
              console.error('[Supabase Auth] Token verification error:', verifyError);
              // Try method 2 if this fails
            } else if (data.session) {
              console.log('[Supabase Auth] Recovery session established via token verification');
              navigate('/auth/reset-password', { replace: true });
              return;
            }
          } catch (error) {
            console.error('[Supabase Auth] Token verification exception:', error);
            // Continue to try other methods
          }
        }
        
        // Method 2: Try with access/refresh tokens from URL
        if (accessToken && refreshToken) {
          console.log('[Supabase Auth] Attempting session establishment with tokens');
          try {
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (sessionError) {
              console.error('[Supabase Auth] Session error:', sessionError);
            } else if (data.session) {
              console.log('[Supabase Auth] Recovery session established via token setting');
              navigate('/auth/reset-password', { replace: true });
              return;
            }
          } catch (error) {
            console.error('[Supabase Auth] Session establishment exception:', error);
          }
        }
        
        // Method 3: Check if we already have a valid session
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('[Supabase Auth] Session check error:', sessionError);
          } else if (session) {
            console.log('[Supabase Auth] Existing valid recovery session found');
            navigate('/auth/reset-password', { replace: true });
            return;
          }
        } catch (error) {
          console.error('[Supabase Auth] Session check exception:', error);
        }
        
        // If all methods failed, redirect with error
        console.error('[Supabase Auth] All recovery methods failed');
        navigate('/shop-login?error=invalid_reset_link');
        return;
      }
      
      // Handle normal sign-in flow
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('[Supabase Auth] Valid session found, redirecting to dashboard');
          navigate('/shop/dashboard', { replace: true });
        } else {
          console.log('[Supabase Auth] No session found, redirecting to login');
          navigate('/shop-login');
        }
      } catch (error) {
        console.error('[Supabase Auth] Session check error:', error);
        navigate('/shop-login');
      }
    };
    
    // Run immediately and prevent other auth systems from processing
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
