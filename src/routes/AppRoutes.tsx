
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/auth';
import { MessagingProvider } from '@/contexts/messaging';
import CustomerRoutes from './CustomerRoutes';
import ShopRoutes from './shop/ShopRoutes';
import Index from '@/pages/Index';
import ShopLogin from '@/pages/shop/Login';
import CustomerLogin from '@/pages/customer/Login';
import NotFound from '@/pages/NotFound';

const AppRoutes: React.FC = () => {
  return (
    <AuthProvider>
      <MessagingProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Login paths - now accessible to all */}
          <Route path="/shop-login" element={<ShopLogin />} />
          <Route path="/customer-login" element={<CustomerLogin />} />

          {/* Direct access to all routes */}
          <Route path="/customer/*" element={<CustomerRoutes />} />
          <Route path="/shop/*" element={<ShopRoutes />} />
          
          {/* Legacy auth path redirects */}
          <Route path="/auth" element={<Navigate to="/" replace />} />
          <Route path="/auth/*" element={<Navigate to="/" replace />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MessagingProvider>
    </AuthProvider>
  );
};

export default AppRoutes;
