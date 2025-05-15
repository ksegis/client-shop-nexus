
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/auth';
import { MessagingProvider } from '@/contexts/messaging';
import CustomerRoutes from './CustomerRoutes';
import ShopRoutes from './shop/ShopRoutes';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
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
          
          {/* Separate login paths */}
          <Route path="/shop-login" element={<ShopLogin />} />
          <Route path="/customer-login" element={<CustomerLogin />} />

          <Route
            path="/customer/*"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerRoutes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shop/*"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <ShopRoutes />
              </ProtectedRoute>
            }
          />
          
          {/* Redirect /auth to the main index page */}
          <Route path="/auth" element={<Navigate to="/" replace />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MessagingProvider>
    </AuthProvider>
  );
};

export default AppRoutes;
