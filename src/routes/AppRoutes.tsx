
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/auth';
import { MessagingProvider } from '@/contexts/messaging';
import { PartsCartProvider } from '@/contexts/parts/PartsCartContext';
import CustomerRoutes from './CustomerRoutes';
import ShopRoutes from './shop/ShopRoutes';
import AdminPage from '@/pages/shop/admin/AdminPage';
import Index from '@/pages/Index';
import ShopLogin from '@/pages/shop/Login';
import CustomerLogin from '@/pages/customer/Login';
import NotFound from '@/pages/NotFound';

const AppRoutes: React.FC = () => {
  // Add debug logging to verify routes are correctly set up
  console.log("AppRoutes component loading");
  
  return (
    <AuthProvider>
      <MessagingProvider>
        <PartsCartProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Login paths - now accessible to all */}
            <Route path="/shop-login" element={<ShopLogin />} />
            <Route path="/customer-login" element={<CustomerLogin />} />

            {/* Direct access to all routes */}
            <Route path="/customer/*" element={<CustomerRoutes />} />
            <Route path="/shop/*" element={<ShopRoutes />} />
            
            {/* Direct access to admin page */}
            <Route path="/admin" element={<AdminPage />} />
            
            {/* Legacy auth path redirects */}
            <Route path="/auth" element={<Navigate to="/" replace />} />
            <Route path="/auth/*" element={<Navigate to="/" replace />} />
            
            {/* Catch all route for any direct /dashboard attempts */}
            <Route path="/dashboard" element={<Navigate to="/customer/dashboard" replace />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PartsCartProvider>
      </MessagingProvider>
    </AuthProvider>
  );
};

export default AppRoutes;
