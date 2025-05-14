
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/auth';
import { MessagingProvider } from '@/contexts/messaging';
import { TestingProvider } from '@/contexts/testing';
import AuthRoutes from './AuthRoutes';
import CustomerRoutes from './CustomerRoutes';
import ShopRoutes from './ShopRoutes';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';
import TestingDashboard from '@/pages/TestingDashboard';

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MessagingProvider>
          <TestingProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth/*" element={<Auth />} />
              <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
              
              {/* Testing Dashboard */}
              <Route 
                path="/testing"
                element={
                  <ProtectedRoute allowedRoles={['staff', 'admin']}>
                    <TestingDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/customer/*"
                element={
                  <ProtectedRoute allowedRoles={['customer', 'staff', 'admin']}>
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TestingProvider>
        </MessagingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;
