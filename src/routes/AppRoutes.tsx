
import { Routes, Route, Navigate } from "react-router-dom";
import NotFound from "@/pages/NotFound";
import Auth from "@/pages/Auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import CustomerLogin from "@/pages/customer/Login";
import CustomerProfile from "@/pages/customer/Profile";
import CustomerEstimates from "@/pages/customer/Estimates";
import CustomerEstimateDetail from "@/pages/customer/EstimateDetail";
import CustomerInvoices from "@/pages/customer/Invoices";
import CustomerTransactions from "@/pages/customer/Transactions";
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

const AppRoutes = () => {
  return (
    <Routes>
      {/* Redirect root to shop dashboard */}
      <Route path="/" element={<Navigate to="/shop" replace />} />
      
      {/* Auth Routes */}
      <Route path="/auth" element={<Auth />} />
      
      {/* Shop Routes */}
      <Route path="/shop/login" element={<ShopLogin />} />
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
      
      {/* Customer Routes */}
      <Route path="/customer/login" element={<CustomerLogin />} />
      <Route 
        path="/customer/profile" 
        element={
          <ProtectedRoute>
            <CustomerProfile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customer/estimates" 
        element={
          <ProtectedRoute>
            <CustomerEstimates />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customer/estimates/:id" 
        element={
          <ProtectedRoute>
            <CustomerEstimateDetail />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customer/invoices" 
        element={
          <ProtectedRoute>
            <CustomerInvoices />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customer/transactions" 
        element={
          <ProtectedRoute>
            <CustomerTransactions />
          </ProtectedRoute>
        } 
      />
      
      {/* Not Found Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
