
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../useAuth';

export const useRedirection = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    const isAuthPage = 
      location.pathname === '/auth' || 
      location.pathname === '/shop/login';

    if (!user && !isAuthPage) {
      // Redirect to login if not authenticated
      navigate('/shop/login', { replace: true });
    } else if (user && isAuthPage) {
      // Redirect to shop dashboard if already authenticated
      navigate('/shop', { replace: true });
    }
  }, [user, isLoading, navigate, location.pathname]);
};
