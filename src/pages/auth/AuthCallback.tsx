
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
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      
      if (error || errorCode) {
        console.error('[Supabase Auth] Callback error:', { error, errorCode, errorDescription });
        navigate('/shop-login?error=' + encodeURIComponent(errorDescription || error || 'Authentication failed'));
        return;
      }
      
      // Handle password recovery flow with token from email
      if (type === 'recovery' && token) {
        console.log('[Supabase Auth] Password recovery with token detected');
        try {
          // Verify the recovery token and get session
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery'
          });
          
          if (verifyError) {
            console.error('[Supabase Auth] Token verification error:', verifyError);
            navigate('/shop-login?error=invalid_reset_link');
            return;
          }
          
          if (data.session) {
            console.log('[Supabase Auth] Recovery session established, redirecting to reset password');
            navigate('/auth/reset-password', { replace: true });
            return;
          }
        } catch (error) {
          console.error('[Supabase Auth] Recovery token verification exception:', error);
          navigate('/shop-login?error=auth_failed');
          return;
        }
      }
      
      // Handle recovery type without token (check current session)
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
