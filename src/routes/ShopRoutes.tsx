import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ShopLogin from "@/pages/shop/Login";
import ShopDashboard from "@/pages/shop/Dashboard";
import ShopReports from "@/pages/shop/Reports";
import ShopEmployees from "@/pages/shop/Employees";
import ShopInventory from "@/pages/shop/Inventory";
import ShopWorkOrders from "@/pages/shop/WorkOrders";
import ShopCustomers from "@/pages/shop/Customers";
import ShopEstimates from "@/pages/shop/Estimates";
import ShopInvoices from "@/pages/shop/invoices";
import ShopProfile from "@/pages/shop/Profile";
import ShopUserManagement from "@/pages/shop/UserManagement";
import ShopAdminDashboard from "@/pages/shop/AdminDashboard";
import SystemHealth from "@/pages/shop/admin/SystemHealth";
import NotFound from "@/pages/NotFound";
import Layout from "@/components/layout/Layout";

const ShopRoutes = () => {
  return (
    <Routes>
      {/* Login route should be accessible without authentication */}
      <Route path="login" element={
        <Layout portalType="shop">
          <ShopLogin />
        </Layout>
      } />
      
      {/* All protected routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout portalType="shop">
              <ShopDashboard />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      {/* Other protected routes */}
      <Route 
        path="profile" 
        element={
          <ProtectedRoute>
            <Layout portalType="shop">
              <ShopProfile />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="settings" 
        element={
          <ProtectedRoute>
            <Layout portalType="shop">
              <ShopProfile />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="reports" 
        element={
          <ProtectedRoute>
            <Layout portalType="shop">
              <ShopReports />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="employees" 
        element={
          <ProtectedRoute>
            <Layout portalType="shop">
              <ShopEmployees />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="inventory" 
        element={
          <ProtectedRoute>
            <Layout portalType="shop">
              <ShopInventory />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="work-orders" 
        element={
          <ProtectedRoute>
            <Layout portalType="shop">
              <ShopWorkOrders />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="customers" 
        element={
          <ProtectedRoute>
            <Layout portalType="shop">
              <ShopCustomers />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="estimates" 
        element={
          <ProtectedRoute>
            <Layout portalType="shop">
              <ShopEstimates />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="invoices" 
        element={
          <ProtectedRoute>
            <Layout portalType="shop">
              <ShopInvoices />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="users" 
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout portalType="shop">
              <ShopUserManagement />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="admin" 
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout portalType="shop">
              <ShopAdminDashboard />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="admin/system-health" 
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout portalType="shop">
              <SystemHealth />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      {/* Catch any unknown routes within /shop/ */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default ShopRoutes;
