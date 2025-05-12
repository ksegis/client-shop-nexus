
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ShopLogin from "@/pages/shop/Login";
import ShopDashboard from "@/pages/shop/Dashboard";
import ReportsPage from "@/pages/shop/Reports";
import EmployeesPage from "@/pages/shop/Employees";
import InventoryPage from "@/pages/shop/Inventory";
import WorkOrdersPage from "@/pages/shop/WorkOrders";
import CustomersPage from "@/pages/shop/Customers";
import Estimates from "@/pages/shop/Estimates";
import Invoices from "@/pages/shop/invoices";
import ShopProfile from "@/pages/shop/Profile";
import ShopUserManagement from "@/pages/shop/UserManagement";
import ShopAdminDashboard from "@/pages/shop/AdminDashboard";
import SystemHealth from "@/pages/shop/admin/SystemHealth";
import NotFound from "@/pages/NotFound";
import Layout from "@/components/layout/Layout";

const ShopRoutes = () => {
  return (
    <Routes>
      {/* Public route */}
      <Route path="login" element={<ShopLogin />} />
      
      {/* All protected routes with a shared layout */}
      <Route 
        element={
          <ProtectedRoute>
            <Layout portalType="shop" />
          </ProtectedRoute>
        }
      >
        <Route index element={<ShopDashboard />} />
        <Route path="profile" element={<ShopProfile />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="work-orders" element={<WorkOrdersPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="estimates" element={<Estimates />} />
        <Route path="invoices" element={<Invoices />} />
        
        {/* Admin-only routes */}
        <Route 
          path="users" 
          element={
            <ProtectedRoute requiredRole="admin">
              <ShopUserManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="admin" 
          element={
            <ProtectedRoute requiredRole="admin">
              <ShopAdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="admin/system-health" 
          element={
            <ProtectedRoute requiredRole="admin">
              <SystemHealth />
            </ProtectedRoute>
          } 
        />
        
        {/* Catch all not found route */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default ShopRoutes;
