
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
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Layout from "@/components/layout/Layout";
import NotFound from "@/pages/NotFound";

const ShopRoutes = () => {
  return (
    <Routes>
      <Route element={<Layout portalType="shop" />}>
        {/* Standard shop routes */}
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
        
        {/* User management routes */}
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
        
        {/* Add catch-all route for shop section */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default ShopRoutes;
