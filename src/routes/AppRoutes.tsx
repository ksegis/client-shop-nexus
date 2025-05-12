
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
      <AuthRoutes />
      
      {/* Shop Routes */}
      <ShopRoutes />
      
      {/* Customer Routes */}
      <CustomerRoutes />
      
      {/* Not Found Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
