
import { Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/shop/Dashboard";
import Profile from "@/pages/shop/Profile";
import Customers from "@/pages/shop/Customers";
import Estimates from "@/pages/shop/Estimates";
import WorkOrders from "@/pages/shop/WorkOrders";
import Invoices from "@/pages/shop/invoices";
import NewInvoiceFromEstimate from "@/pages/shop/invoices/NewInvoiceFromEstimate";
import Inventory from "@/pages/shop/Inventory";
import Reports from "@/pages/shop/Reports";
import AdminDashboard from "@/pages/shop/AdminDashboard";
import ApiKeysManager from "@/pages/shop/admin/ApiKeysManager";
import StaffManager from "@/pages/shop/admin/StaffManager";
import SystemHealth from "@/pages/shop/admin/SystemHealth";
import UserManagement from "@/pages/shop/UserManagement";
import Employees from "@/pages/shop/Employees";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const ShopRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <Customers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/estimates"
        element={
          <ProtectedRoute>
            <Estimates />
          </ProtectedRoute>
        }
      />
      <Route
        path="/work-orders"
        element={
          <ProtectedRoute>
            <WorkOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices"
        element={
          <ProtectedRoute>
            <Invoices />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices/new"
        element={
          <ProtectedRoute>
            <NewInvoiceFromEstimate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <Inventory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/api-keys"
        element={
          <ProtectedRoute requiredRole="admin">
            <ApiKeysManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/staff"
        element={
          <ProtectedRoute requiredRole="admin">
            <StaffManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/system"
        element={
          <ProtectedRoute requiredRole="admin">
            <SystemHealth />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <Employees />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default ShopRoutes;
