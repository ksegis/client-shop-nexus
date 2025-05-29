
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('[Supabase Auth] Auth callback handler started');
      console.log('Current URL:', window.location.href);
      console.log('Search params:', Object.fromEntries(searchParams.entries()));
      
      // Check for Supabase auth callback parameters
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const type = searchParams.get('type');
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      
      if (error) {
        console.error('[Supabase Auth] Callback error:', error);
        navigate('/shop-login?error=' + encodeURIComponent(error));
        return;
      }
      
      // Handle password recovery flow with tokens
      if (type === 'recovery' && accessToken && refreshToken) {
        console.log('[Supabase Auth] Password recovery with tokens detected');
        try {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (sessionError) {
            console.error('[Supabase Auth] Session error:', sessionError);
            navigate('/shop-login?error=auth_failed');
            return;
          }
          
          console.log('[Supabase Auth] Recovery session established, redirecting to reset password');
          navigate('/auth/reset-password', { replace: true });
          return;
        } catch (error) {
          console.error('[Supabase Auth] Recovery session exception:', error);
          navigate('/shop-login?error=auth_failed');
          return;
        }
      }
      
      // Handle standard auth code exchange
      if (code) {
        console.log('[Supabase Auth] Auth code found, exchanging for session');
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('[Supabase Auth] Code exchange error:', exchangeError);
            navigate('/shop-login?error=auth_failed');
            return;
          }
          
          if (data.session) {
            console.log('[Supabase Auth] Session established, redirecting to dashboard');
            navigate('/shop/dashboard', { replace: true });
            return;
          }
        } catch (error) {
          console.error('[Supabase Auth] Code exchange exception:', error);
          navigate('/shop-login?error=auth_failed');
          return;
        }
      }
      
      // Handle recovery type without tokens (redirect to reset form)
      if (type === 'recovery') {
        console.log('[Supabase Auth] Password recovery type detected, redirecting to reset form');
        navigate('/auth/reset-password?' + searchParams.toString(), { replace: true });
        return;
      }
      
      // Default fallback
      console.log('[Supabase Auth] No specific callback handling needed, redirecting to login');
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
