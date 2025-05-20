
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
import SecurityDashboard from "@/pages/shop/admin/components/SecurityDashboard";
import AdminPage from "@/pages/shop/admin/AdminPage";
import DeleteUserByEmailPage from "@/pages/shop/admin/users/DeleteUserByEmailPage";

const ShopRoutes = () => {
  return (
    <Layout portalType="shop">
      <Routes>
        {/* Shop main dashboard */}
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Shop user profile */}
        <Route path="profile" element={<Profile />} />
        
        {/* Customer management */}
        <Route path="customers" element={<Customers />} />
        
        {/* Document management */}
        <Route path="estimates" element={<Estimates />} />
        <Route path="work-orders" element={<WorkOrders />} />
        <Route path="work-orders/:id" element={<WorkOrderDetailPage />} />
        <Route path="invoices" element={<Invoices />} />
        
        {/* Reporting */}
        <Route path="reports" element={<Reports />} />
        
        {/* Inventory management */}
        <Route path="parts" element={<Parts />} />
        <Route path="inventory" element={<Inventory />} />
        
        {/* Service management */}
        <Route path="service-desk" element={<ServiceDesk />} />
        <Route path="service-appointments" element={<ServiceAppointments />} />
        
        {/* Employee management */}
        <Route path="employees" element={<Employees />} />
        
        {/* Admin section - all admin routes now under /shop/admin/ */}
        <Route path="admin" element={<AdminPage />} />
        
        <Route path="admin/user-management" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagement />
          </ProtectedRoute>
        } />
        
        <Route path="admin/delete-user" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DeleteUserByEmailPage />
          </ProtectedRoute>
        } />

        <Route path="admin/session-management" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <SessionManagement />
          </ProtectedRoute>
        } />
        
        <Route path="admin/security-dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <SecurityDashboard />
          </ProtectedRoute>
        } />
        
        {/* Catch all undefined routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

export default ShopRoutes;
