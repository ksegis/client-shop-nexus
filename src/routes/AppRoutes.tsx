
import { Routes, Route, Navigate } from "react-router-dom";
import NotFound from "@/pages/NotFound";
import AuthRoutes from "./AuthRoutes";
import CustomerRoutes from "./CustomerRoutes";
import ShopRoutes from "./ShopRoutes";
import Index from "@/pages/Index";
import ShopLogin from "@/pages/shop/Login";
import Auth from "@/pages/Auth";

const AppRoutes = () => {
  // Handle hash fragments - redirect to auth if there's a # in the URL
  if (window.location.hash && window.location.pathname === '/') {
    window.history.replaceState(null, '', '/auth');
    return <Navigate to="/auth" replace />;
  }

  return (
    <Routes>
      {/* Root routes - render Index component that will redirect based on auth status */}
      <Route index element={<Index />} />
      
      {/* Shop Login Route - explicit route to ensure it's accessible */}
      <Route path="/shop/login" element={<ShopLogin />} />
      
      {/* Auth Routes */}
      <Route path="/auth/*" element={<AuthRoutes />} />
      <Route path="/#" element={<Auth />} />
      
      {/* Shop Routes */}
      <Route path="/shop/*" element={<ShopRoutes />} />
      
      {/* Customer Routes */}
      <Route path="/customer/*" element={<CustomerRoutes />} />
      
      {/* Add a redirect for /customers to /customer for backward compatibility */}
      <Route path="/customers" element={<Navigate to="/customer" replace />} />
      <Route path="/customers/*" element={<Navigate to="/customer" replace />} />
      
      {/* Not Found Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
