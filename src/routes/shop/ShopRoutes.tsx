
import { Routes, Route } from "react-router-dom";
import ShopLogin from "@/pages/shop/Login";
import NotFound from "@/pages/NotFound";
import MainRoutes from "./MainRoutes";
import CustomerRoutes from "./CustomerRoutes";
import WorkOrderRoutes from "./WorkOrderRoutes";
import InventoryRoutes from "./InventoryRoutes";
import AdminRoutes from "./AdminRoutes";
import FinancialRoutes from "./FinancialRoutes";
import ServiceRoutes from "./ServiceRoutes";

/**
 * Main shop routes component - imports and aggregates all shop route groups
 */
const ShopRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<ShopLogin />} />
      
      {/* Core dashboard route */}
      <MainRoutes />
      
      {/* Customer management routes */}
      <CustomerRoutes />
      
      {/* Work order routes */}
      <WorkOrderRoutes />
      
      {/* Inventory and parts routes */}
      <InventoryRoutes />
      
      {/* Financial routes - estimates and invoices */}
      <FinancialRoutes />
      
      {/* Service desk and appointments routes */}
      <ServiceRoutes />
      
      {/* Admin routes */}
      <AdminRoutes />
      
      {/* Catch all unmatched routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default ShopRoutes;
