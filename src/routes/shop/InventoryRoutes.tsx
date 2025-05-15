
import { Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Inventory from "@/pages/shop/Inventory";
import Parts from "@/pages/shop/Parts";
import SimpleInventory from "@/pages/shop/SimpleInventory";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

/**
 * Inventory and parts management routes
 */
const InventoryRoutes = () => {
  return (
    <>
      <Route 
        path="inventory" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'test_staff', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <Inventory />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="parts" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'test_staff', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <Parts />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="simple-inventory" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'test_staff', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <SimpleInventory />
            </Layout>
          </ProtectedRoute>
        } 
      />
    </>
  );
};

export default InventoryRoutes;
