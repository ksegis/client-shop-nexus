
import { Routes, Route, Navigate } from "react-router-dom";
import NotFound from "@/pages/NotFound";
import AuthRoutes from "./AuthRoutes";
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
      {/* Root routes - render Index component */}
      <Route index element={<Index />} />
      
      {/* Shop Login Route */}
      <Route path="/shop/login" element={<ShopLogin />} />
      
      {/* Auth Routes */}
      <Route path="/auth/*" element={<AuthRoutes />} />
      <Route path="/#" element={<Auth />} />
      
      {/* Shop Routes */}
      <Route path="/shop/*" element={<ShopRoutes />} />
      
      {/* Not Found Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
