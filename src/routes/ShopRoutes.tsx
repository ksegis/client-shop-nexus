
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
      <Route path="login" element={<ShopLogin />} />
      
      {/* All protected routes - wrapped in a single Layout */}
      <Route element={
        <ProtectedRoute>
          <Layout portalType="shop">
            <Routes>
              <Route path="/" element={<ShopDashboard />} />
              <Route path="profile" element={<ShopProfile />} />
              <Route path="reports" element={<ShopReports />} />
              <Route path="employees" element={<ShopEmployees />} />
              <Route path="inventory" element={<ShopInventory />} />
              <Route path="work-orders" element={<ShopWorkOrders />} />
              <Route path="customers" element={<ShopCustomers />} />
              <Route path="estimates" element={<ShopEstimates />} />
              <Route path="invoices" element={<ShopInvoices />} />
              <Route path="users" element={
                <ProtectedRoute requiredRole="admin">
                  <ShopUserManagement />
                </ProtectedRoute>
              } />
              <Route path="admin" element={
                <ProtectedRoute requiredRole="admin">
                  <ShopAdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="admin/system-health" element={
                <ProtectedRoute requiredRole="admin">
                  <SystemHealth />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default ShopRoutes;
