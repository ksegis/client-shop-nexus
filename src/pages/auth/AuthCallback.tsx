
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
      const error = searchParams.get('error');
      const errorCode = searchParams.get('error_code');
      const errorDescription = searchParams.get('error_description');
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const type = searchParams.get('type');
      
      if (error || errorCode) {
        console.error('[Supabase Auth] Callback error:', { error, errorCode, errorDescription });
        navigate('/shop-login?error=' + encodeURIComponent(errorDescription || error || 'Authentication failed'));
        return;
      }
      
      // Handle password recovery flow with direct tokens in URL
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
      
      // Handle recovery type without tokens (verify with current session)
      if (type === 'recovery') {
        console.log('[Supabase Auth] Password recovery type detected');
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session) {
            console.error('[Supabase Auth] No valid session for recovery:', sessionError);
            navigate('/shop-login?error=invalid_reset_link');
            return;
          }
          
          console.log('[Supabase Auth] Valid recovery session found, redirecting to reset password');
          navigate('/auth/reset-password', { replace: true });
          return;
        } catch (error) {
          console.error('[Supabase Auth] Recovery session check exception:', error);
          navigate('/shop-login?error=auth_failed');
          return;
        }
      }
      
      // Default fallback - check if user has a valid session
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
