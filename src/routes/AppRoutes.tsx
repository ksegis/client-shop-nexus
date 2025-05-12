
import { Routes, Route, Navigate } from "react-router-dom";
import NotFound from "@/pages/NotFound";
import AuthRoutes from "./AuthRoutes";
import CustomerRoutes from "./CustomerRoutes";
import ShopRoutes from "./ShopRoutes";
import Index from "@/pages/Index";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Root routes - render Index component that will redirect based on auth status */}
      <Route path="/" element={<Index />} />
      
      {/* Auth Routes */}
      <Route path="/auth/*" element={<AuthRoutes />} />
      
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
