
import { Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/shop/Dashboard";
import Profile from "@/pages/shop/Profile";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

/**
 * Core shop routes for dashboard and profile
 */
const MainRoutes = () => {
  return (
    <>
      <Route 
        path="" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'test_staff', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="profile" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'test_staff', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <Profile />
            </Layout>
          </ProtectedRoute>
        } 
      />
    </>
  );
};

export default MainRoutes;
