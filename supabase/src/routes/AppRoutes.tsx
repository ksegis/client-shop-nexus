
import { Routes, Route, Navigate } from "react-router-dom";
import Index from "@/pages/Index";
import ShopLogin from "@/pages/shop/Login";
import CustomerLogin from "@/pages/customer/Login";
import ShopRoutes from "@/routes/shop/ShopRoutes";
import CustomerRoutes from "@/routes/CustomerRoutes";
import ChangePassword from "@/pages/auth/ChangePassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import AuthCallback from "@/pages/auth/AuthCallback";
import InviteAccept from "@/pages/auth/InviteAccept";
import NotFound from "@/pages/NotFound";
import Unauthorized from "@/pages/Unauthorized";
import KeystoneTest from "@/components/KeystoneTest";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/shop-login" element={<ShopLogin />} />
      <Route path="/customer-login" element={<CustomerLogin />} />
      
      {/* Keystone test route */}
      <Route path="/keystone-test" element={<KeystoneTest />} />
      
      {/* Auth routes */}
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/auth/change-password" element={<ChangePassword />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      <Route path="/auth/invite-accept" element={<InviteAccept />} />
      
      {/* Protected shop routes */}
      <Route path="/shop/*" element={<ShopRoutes />} />
      
      {/* Protected customer routes */}
      <Route path="/customer/*" element={<CustomerRoutes />} />
      
      {/* Error pages */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRoutes;
