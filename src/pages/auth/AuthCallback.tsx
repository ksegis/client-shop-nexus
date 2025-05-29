
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('=== AUTH CALLBACK DEBUG ===');
      console.log('Current URL:', window.location.href);
      console.log('Search params:', Object.fromEntries(searchParams.entries()));
      
      // Simple redirect to shop login - no specific callback handling needed
      console.log('Redirecting to shop login');
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
