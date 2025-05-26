import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/auth';
import { MessagingProvider } from '@/contexts/messaging';
import { PartsCartProvider } from '@/contexts/parts/PartsCartContext';
import CustomerRoutes from './CustomerRoutes';
import ShopRoutes from './shop/ShopRoutes';
import Index from '@/pages/Index';
import ShopLogin from '@/pages/shop/Login';
import CustomerLogin from '@/pages/customer/Login';
import NotFound from '@/pages/NotFound';
import Unauthorized from '@/pages/Unauthorized';
import { useAuth } from '@/contexts/auth';
import AuthCallbackPage from '@/pages/auth/Callback';
import VerifyMFA from '@/pages/VerifyMFA';
import InviteAccept from '@/pages/auth/InviteAccept';
import ChangePassword from '@/pages/auth/ChangePassword';
import AccountRecovery from '@/pages/AccountRecovery';

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

// Check if user needs to change password
const PasswordChangeRedirect = () => {
  const { profile } = useAuth();
  
  if (!profile) {
    return <div className="p-6">Loading profile...</div>;
  }
  
  // If force_password_change is true, redirect to change password page
  if (profile.force_password_change) {
    return <Navigate to="/auth/change-password" replace />;
  }
  
  // Otherwise continue to the requested page
  return null;
};

// Auth checker for shop routes
const ShopRoutesWrapper = () => {
  const { user, isLoading } = useAuth();
  
  // If loading, show loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading authentication state...</p>
        </div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/shop-login" replace />;
  }
  
  // User is authenticated, show shop routes
  return (
    <>
      <PasswordChangeRedirect />
      <ShopRoutes />
    </>
  );
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

            {/* Invitation and password change routes - these should be accessible without authentication */}
            <Route path="/auth/invite" element={<InviteAccept />} />
            <Route path="/auth/change-password" element={<ChangePassword />} />
            
            {/* Account recovery route */}
            <Route path="/account-recovery" element={<AccountRecovery />} />

            {/* MFA verification route */}
            <Route path="/verify-mfa" element={<VerifyMFA />} />

            {/* Customer portal routes - clearly labeled */}
            <Route path="/customer/*" element={
              <>
                <PasswordChangeRedirect />
                <CustomerRoutes />
              </>
            } />
            
            {/* Shop portal routes - everything under /shop prefix */}
            <Route path="/shop/*" element={<ShopRoutesWrapper />} />
            
            {/* Unauthorized access page */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Profile redirect - new route to handle /profile requests */}
            <Route path="/profile" element={<ProfileRedirect />} />
            
            {/* Authentication callback routes */}
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            
            {/* Legacy auth paths redirects */}
            <Route path="/auth" element={<Navigate to="/" replace />} />
            
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
