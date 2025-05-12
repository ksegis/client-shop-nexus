
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
import NotFound from "@/pages/NotFound";

const ShopRoutes = () => {
  return (
    <Routes>
      {/* Login route should be accessible without authentication */}
      <Route path="login" element={<ShopLogin />} />
      
      {/* All protected routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <ShopDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="profile" 
        element={
          <ProtectedRoute>
            <ShopProfile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="settings" 
        element={
          <ProtectedRoute>
            <ShopProfile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="reports" 
        element={
          <ProtectedRoute>
            <ShopReports />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="employees" 
        element={
          <ProtectedRoute>
            <ShopEmployees />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="inventory" 
        element={
          <ProtectedRoute>
            <ShopInventory />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="work-orders" 
        element={
          <ProtectedRoute>
            <ShopWorkOrders />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="customers" 
        element={
          <ProtectedRoute>
            <ShopCustomers />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="estimates" 
        element={
          <ProtectedRoute>
            <ShopEstimates />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="invoices" 
        element={
          <ProtectedRoute>
            <ShopInvoices />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="users" 
        element={
          <ProtectedRoute requiredRole="admin">
            <ShopUserManagement />
          </ProtectedRoute>
        } 
      />
      
      {/* Catch any unknown routes within /shop/ */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default ShopRoutes;
