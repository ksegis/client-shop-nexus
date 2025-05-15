
import { Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import WorkOrders from "@/pages/shop/WorkOrders";
import WorkOrderDetailPage from "@/pages/shop/work-orders/WorkOrderDetailPage";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

/**
 * Work order related routes
 */
const WorkOrderRoutes = () => {
  return (
    <>
      <Route 
        path="work-orders" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'test_staff', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <WorkOrders />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="work-orders/:id" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'test_staff', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <WorkOrderDetailPage />
            </Layout>
          </ProtectedRoute>
        } 
      />
    </>
  );
};

export default WorkOrderRoutes;
