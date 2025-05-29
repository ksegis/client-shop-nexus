
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('EGIS callback route accessed, redirecting to shop login');
    navigate('/shop-login');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-4">
          <div className="h-12 w-12 mx-auto border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
        <h1 className="text-xl font-semibold mb-2">Redirecting...</h1>
        <p className="text-gray-500">Redirecting to login page</p>
      </div>
    </div>
  );
}
