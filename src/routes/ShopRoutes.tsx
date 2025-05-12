
import { Route } from "react-router-dom";
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

const ShopRoutes = () => {
  return (
    <>
      {/* Shop Login Route */}
      <Route path="/shop/login" element={<ShopLogin />} />
      
      {/* Shop Protected Routes */}
      <Route 
        path="/shop" 
        element={
          <ProtectedRoute>
            <ShopDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/shop/profile" 
        element={
          <ProtectedRoute>
            <ShopProfile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/shop/reports" 
        element={
          <ProtectedRoute>
            <ShopReports />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/shop/employees" 
        element={
          <ProtectedRoute>
            <ShopEmployees />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/shop/inventory" 
        element={
          <ProtectedRoute>
            <ShopInventory />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/shop/work-orders" 
        element={
          <ProtectedRoute>
            <ShopWorkOrders />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/shop/customers" 
        element={
          <ProtectedRoute>
            <ShopCustomers />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/shop/estimates" 
        element={
          <ProtectedRoute>
            <ShopEstimates />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/shop/invoices" 
        element={
          <ProtectedRoute>
            <ShopInvoices />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/shop/users" 
        element={
          <ProtectedRoute requiredRole="admin">
            <ShopUserManagement />
          </ProtectedRoute>
        } 
      />
    </>
  );
};

export default ShopRoutes;
