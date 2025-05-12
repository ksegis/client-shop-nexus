
import { Routes, Route, Navigate } from "react-router-dom";
import NotFound from "@/pages/NotFound";
import AuthRoutes from "./AuthRoutes";
import CustomerRoutes from "./CustomerRoutes";
import ShopRoutes from "./ShopRoutes";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Redirect root to shop dashboard */}
      <Route path="/" element={<Navigate to="/shop" replace />} />
      
      {/* Auth Routes */}
      {/* Import each route from AuthRoutes instead of using the component */}
      <Route path="/auth/*" element={<AuthRoutes />} />
      
      {/* Shop Routes */}
      <Route path="/shop/*" element={<ShopRoutes />} />
      
      {/* Customer Routes */}
      <Route path="/customer/*" element={<CustomerRoutes />} />
      
      {/* Not Found Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
