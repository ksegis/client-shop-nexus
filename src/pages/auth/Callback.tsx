
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { egisAuth } from '@/services/auth/egisAuth';
import { useAuth } from '@/contexts/auth';

export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('Processing authentication...');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/shop');
      return;
    }

    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      console.error(`[EGIS Auth] Error: ${error}`);
      setStatus(`Authentication error: ${error}`);
      setTimeout(() => navigate(`/auth?error=${error}`), 2000);
      return;
    }

    if (!code || !state) {
      console.error('[EGIS Auth] Missing code or state parameter');
      setStatus('Invalid callback parameters');
      setTimeout(() => navigate('/auth?error=invalid_callback'), 2000);
      return;
    }

    const handleAuth = async () => {
      try {
        setStatus('Validating authentication...');
        const result = await egisAuth.handleCallback(code, state);
        
        console.log('[EGIS Auth] Authentication successful', result);
        setStatus('Authentication successful! Redirecting...');
        
        // Check if we have a specific redirect path
        if (result && result.redirectPath) {
          navigate(result.redirectPath);
        } else {
          // Default redirect based on user role
          navigate('/shop');
        }
      } catch (err: any) {
        console.error('[EGIS Auth]', err);
        setStatus(`Authentication failed: ${err.message || 'Unknown error'}`);
        setTimeout(() => navigate('/auth?error=auth_failed'), 2000);
      }
    };

    handleAuth();
  }, [params, navigate, isAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-4">
          <div className="h-12 w-12 mx-auto border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
        <h1 className="text-xl font-semibold mb-2">EGIS Authentication</h1>
        <p className="text-gray-500">{status}</p>
      </div>
    </div>
  );
}
