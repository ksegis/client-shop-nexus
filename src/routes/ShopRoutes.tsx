import { Routes, Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ShopLogin from "@/pages/shop/Login";
import Dashboard from "@/pages/shop/Dashboard";
import Customers from "@/pages/shop/Customers";
import WorkOrders from "@/pages/shop/WorkOrders";
import WorkOrderDetailPage from "@/pages/shop/work-orders/WorkOrderDetailPage";
import Inventory from "@/pages/shop/Inventory";
import Parts from "@/pages/shop/Parts";
import Profile from "@/pages/shop/Profile";
import NotFound from "@/pages/NotFound";
import Estimates from "@/pages/shop/Estimates";
import Invoices from "@/pages/shop/invoices";
import Reports from "@/pages/shop/Reports";
import ServiceAppointments from "@/pages/shop/ServiceAppointments";
import ServiceDesk from "@/pages/shop/ServiceDesk";
import SimpleInventory from "@/pages/shop/SimpleInventory";
import Employees from "@/pages/shop/Employees";
import AdminPage from "@/pages/shop/admin/AdminPage";
import UserManagement from "@/pages/shop/admin/UserManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import TestUsers from "@/pages/shop/admin/TestUsers";
import AuthLogs from "@/pages/shop/admin/AuthLogs";

const ShopRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<ShopLogin />} />
      <Route 
        path="" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'test_staff', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="customers" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'test_staff', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <Customers />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="work-orders" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'test_staff', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <WorkOrders />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="work-orders/:id" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'test_staff', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <WorkOrderDetailPage />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="inventory" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'test_staff', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <Inventory />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="parts" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'test_staff', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <Parts />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="profile" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'test_staff', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <Profile />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="estimates" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'test_staff', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <Estimates />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="invoices" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'test_staff', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <Invoices />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="reports" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'test_staff', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <Reports />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="appointments" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'test_staff', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <ServiceAppointments />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="service" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'test_staff', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <ServiceDesk />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="simple-inventory" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'test_staff', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <SimpleInventory />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="employees" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <Employees />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="admin" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <AdminPage />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="admin/users" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <UserManagement />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="admin/test-users" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <TestUsers />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="admin/auth-logs" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <AuthLogs />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default ShopRoutes;
