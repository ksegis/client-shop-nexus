
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "@/pages/shop/Dashboard";
import Profile from "@/pages/shop/Profile";
import Customers from "@/pages/shop/Customers";
import Estimates from "@/pages/shop/Estimates";
import WorkOrders from "@/pages/shop/WorkOrders";
import Invoices from "@/pages/shop/invoices";
import NewInvoiceFromEstimate from "@/pages/shop/invoices/NewInvoiceFromEstimate";
import Inventory from "@/pages/shop/Inventory";
import Reports from "@/pages/shop/Reports";
import UserManagement from "@/pages/shop/UserManagement";
import Employees from "@/pages/shop/Employees";
import ApiConnectionsManager from "@/pages/shop/admin/ApiConnectionsManager";
import AdminUserManagement from "@/pages/shop/admin/UserManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Layout from "@/components/layout/Layout";
import NotFound from "@/pages/NotFound";
import SimpleInventory from "@/pages/shop/SimpleInventory";
import Parts from "@/pages/shop/Parts";
import { PartsCartProvider } from "@/contexts/parts/PartsCartContext";

// Define which roles are allowed to access shop routes
const shopStaffRoles = ['staff', 'admin'];
const adminOnlyRoles = ['admin'];

const ShopRoutes = () => {
  return (
    <PartsCartProvider>
      <Routes>
        <Route element={<Layout portalType="shop" />}>
          {/* Standard shop routes - staff and admin only */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={shopStaffRoles}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={shopStaffRoles}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute allowedRoles={shopStaffRoles}>
                <Customers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estimates"
            element={
              <ProtectedRoute allowedRoles={shopStaffRoles}>
                <Estimates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/work-orders"
            element={
              <ProtectedRoute allowedRoles={shopStaffRoles}>
                <WorkOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <ProtectedRoute allowedRoles={shopStaffRoles}>
                <Invoices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices/new"
            element={
              <ProtectedRoute allowedRoles={shopStaffRoles}>
                <NewInvoiceFromEstimate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute allowedRoles={shopStaffRoles}>
                <Inventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parts-inventory"
            element={
              <ProtectedRoute allowedRoles={shopStaffRoles}>
                <SimpleInventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parts"
            element={
              <ProtectedRoute allowedRoles={shopStaffRoles}>
                <Parts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={shopStaffRoles}>
                <Reports />
              </ProtectedRoute>
            }
          />
          
          {/* User management routes */}
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={shopStaffRoles}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <ProtectedRoute allowedRoles={shopStaffRoles}>
                <Employees />
              </ProtectedRoute>
            }
          />
          
          {/* Admin routes - admin only */}
          <Route
            path="/admin/api-connections"
            element={
              <ProtectedRoute allowedRoles={adminOnlyRoles}>
                <ApiConnectionsManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={adminOnlyRoles}>
                <AdminUserManagement />
              </ProtectedRoute>
            }
          />
          
          {/* Add catch-all route for shop section */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </PartsCartProvider>
  );
};

export default ShopRoutes;
