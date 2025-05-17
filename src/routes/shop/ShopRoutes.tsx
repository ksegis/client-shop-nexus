
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/shop/Dashboard";
import Profile from "@/pages/shop/Profile";
import Customers from "@/pages/shop/Customers";
import Estimates from "@/pages/shop/Estimates";
import Inventory from "@/pages/shop/Inventory";
import Parts from "@/pages/shop/Parts";
import Reports from "@/pages/shop/Reports";
import ServiceDesk from "@/pages/shop/ServiceDesk";
import ServiceAppointments from "@/pages/shop/ServiceAppointments";
import Employees from "@/pages/shop/Employees";
import WorkOrders from "@/pages/shop/WorkOrders";
import WorkOrderDetailPage from "@/pages/shop/work-orders/WorkOrderDetailPage";
import NotFound from "@/pages/NotFound";
import Invoices from "@/pages/shop/invoices";
import UserManagement from "@/pages/shop/admin/UserManagement";
import SessionManagement from "@/pages/shop/admin/SessionManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const ShopRoutes = () => {
  return (
    <Layout portalType="shop">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/estimates" element={<Estimates />} />
        <Route path="/work-orders" element={<WorkOrders />} />
        <Route path="/work-orders/:id" element={<WorkOrderDetailPage />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/parts" element={<Parts />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/service-desk" element={<ServiceDesk />} />
        <Route path="/service-appointments" element={<ServiceAppointments />} />
        <Route path="/employees" element={<Employees />} />
        
        {/* Add protected routes for admin-only pages */}
        <Route path="/user-management" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagement />
          </ProtectedRoute>
        } />

        <Route path="/session-management" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <SessionManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/user-management" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/session-management" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <SessionManagement />
          </ProtectedRoute>
        } />
        
        {/* Removing the nested /admin route to avoid conflicts */}
        {/* Redirect /shop/admin to the root /admin path */}
        <Route path="/admin" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

export default ShopRoutes;
