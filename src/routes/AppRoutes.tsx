
import { Routes, Route, Navigate } from "react-router-dom";
import NotFound from "@/pages/NotFound";
import AuthRoutes from "./AuthRoutes";
import CustomerRoutes from "./CustomerRoutes";
import ShopRoutes from "./ShopRoutes";
import Index from "@/pages/Index";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Root route - render Index component that will redirect based on auth status */}
      <Route path="/" element={<Index />} />
      
      {/* Auth Routes */}
      <Route path="/auth/*" element={<AuthRoutes />} />
      
      {/* Shop Routes - make sure no parent paths are missing */}
      <Route path="/shop/*" element={<ShopRoutes />} />
      
      {/* Customer Routes - make sure no parent paths are missing */}
      <Route path="/customer/*" element={<CustomerRoutes />} />
      
      {/* Not Found Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
