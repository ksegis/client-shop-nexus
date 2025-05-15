
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
      
      {/* Core dashboard routes */}
      {/* Wrap the components with Fragment to include their routes */}
      <Route path="">
        <MainRoutes />
      </Route>
      
      {/* Customer management routes */}
      <Route path="">
        <CustomerRoutes />
      </Route>
      
      {/* Work order routes */}
      <Route path="">
        <WorkOrderRoutes />
      </Route>
      
      {/* Inventory and parts routes */}
      <Route path="">
        <InventoryRoutes />
      </Route>
      
      {/* Financial routes - estimates and invoices */}
      <Route path="">
        <FinancialRoutes />
      </Route>
      
      {/* Service desk and appointments routes */}
      <Route path="">
        <ServiceRoutes />
      </Route>
      
      {/* Admin routes */}
      <Route path="">
        <AdminRoutes />
      </Route>
      
      {/* Catch all unmatched routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default ShopRoutes;
