
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
import Unauthorized from '@/pages/Unauthorized';
import { useAuth } from '@/contexts/auth';
import AuthCallbackPage from '@/pages/auth/Callback';
import VerifyMFA from '@/pages/VerifyMFA'; // Add this import

// Profile redirect component that checks the user role and redirects accordingly
const ProfileRedirect = () => {
  const { profile } = useAuth();
  
  // If no profile or still loading, show a simple loading message
  if (!profile) {
    return <div className="p-6">Loading profile...</div>;
  }
  
  // Redirect based on role
  if (profile.role === 'customer') {
    return <Navigate to="/customer/profile" replace />;
  } else {
    // Staff and admin both use the shop profile
    return <Navigate to="/shop/profile" replace />;
  }
};

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

            {/* MFA verification route */}
            <Route path="/verify-mfa" element={<VerifyMFA />} />

            {/* Direct access to all routes */}
            <Route path="/customer/*" element={<CustomerRoutes />} />
            <Route path="/shop/*" element={<ShopRoutes />} />
            
            {/* Direct access to admin page at root level */}
            <Route path="/admin" element={<AdminPage />} />
            
            {/* Unauthorized access page */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Profile redirect - new route to handle /profile requests */}
            <Route path="/profile" element={<ProfileRedirect />} />
            
            {/* Authentication callback routes */}
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            
            {/* Legacy auth paths redirects */}
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
