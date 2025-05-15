
import { Routes, Route, Navigate } from "react-router-dom";
import Auth from "@/pages/Auth";
import ShopLogin from "@/pages/shop/Login";
import CustomerLogin from "@/pages/customer/Login";
import NotFound from "@/pages/NotFound";
import { AuthDebugger } from "@/components/debug/AuthDebugger";
import { AuthorizationDebugger } from "@/components/debug/AuthorizationDebugger";

const AuthRoutes = () => {
  return (
    <>
      {process.env.NODE_ENV === 'development' && <AuthDebugger componentName="AuthRoutes" />}
      {/* Add AuthorizationDebugger to show auth decision flow */}
      <AuthorizationDebugger />
      <Routes>
        <Route path="/" element={<Navigate to="/auth/login" replace />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/shop/login" element={<ShopLogin />} />
        <Route path="/customer-login" element={<CustomerLogin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default AuthRoutes;
