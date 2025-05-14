
import { Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/shop/Dashboard";
import Parts from "@/pages/shop/Parts";
import SimpleInventory from "@/pages/shop/SimpleInventory";
import Inventory from "@/pages/shop/Inventory";
import Profile from "@/pages/shop/Profile";
import Employees from "@/pages/shop/Employees";
import Customers from "@/pages/shop/Customers";
import Estimates from "@/pages/shop/Estimates";
import ServiceAppointments from "@/pages/shop/ServiceAppointments";
import WorkOrders from "@/pages/shop/WorkOrders";
import Invoices from "@/pages/shop/invoices";
import Reports from "@/pages/shop/Reports";
import ApiConnectionsManager from "@/pages/shop/admin/ApiConnectionsManager";
import UserManagement from "@/pages/shop/UserManagement";
import RlsTroubleshooter from "@/components/dev/RlsTroubleshooter";
import NotFound from "@/pages/NotFound";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { PartsCartProvider } from "@/contexts/parts/PartsCartContext";
import ServiceDesk from "@/pages/shop/ServiceDesk";

// Define which roles are allowed to access shop routes
const staffAndAdmin = ['staff', 'admin'];
const adminOnly = ['admin'];

const ShopRoutes = () => {
  return (
    <Routes>
      <Route element={<Layout portalType="shop" />}>
        <Route index element={
          <ProtectedRoute allowedRoles={staffAndAdmin}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="dashboard" element={
          <ProtectedRoute allowedRoles={staffAndAdmin}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="service-desk" element={
          <ProtectedRoute allowedRoles={staffAndAdmin}>
            <ServiceDesk />
          </ProtectedRoute>
        } />
        <Route path="parts" element={
          <ProtectedRoute allowedRoles={staffAndAdmin}>
            <PartsCartProvider>
              <Parts />
            </PartsCartProvider>
          </ProtectedRoute>
        } />
        <Route path="inventory/simple" element={
          <ProtectedRoute allowedRoles={staffAndAdmin}>
            <SimpleInventory />
          </ProtectedRoute>
        } />
        <Route path="inventory" element={
          <ProtectedRoute allowedRoles={staffAndAdmin}>
            <Inventory />
          </ProtectedRoute>
        } />
        <Route path="profile" element={
          <ProtectedRoute allowedRoles={staffAndAdmin}>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="employees" element={
          <ProtectedRoute allowedRoles={staffAndAdmin}>
            <Employees />
          </ProtectedRoute>
        } />
        <Route path="customers" element={
          <ProtectedRoute allowedRoles={staffAndAdmin}>
            <Customers />
          </ProtectedRoute>
        } />
        <Route path="estimates" element={
          <ProtectedRoute allowedRoles={staffAndAdmin}>
            <Estimates />
          </ProtectedRoute>
        } />
        <Route path="work-orders" element={
          <ProtectedRoute allowedRoles={staffAndAdmin}>
            <WorkOrders />
          </ProtectedRoute>
        } />
        <Route path="service-appointments" element={
          <ProtectedRoute allowedRoles={staffAndAdmin}>
            <ServiceAppointments />
          </ProtectedRoute>
        } />
        <Route path="invoices" element={
          <ProtectedRoute allowedRoles={staffAndAdmin}>
            <Invoices />
          </ProtectedRoute>
        } />
        <Route path="reports" element={
          <ProtectedRoute allowedRoles={staffAndAdmin}>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="admin/api-connections" element={
          <ProtectedRoute allowedRoles={adminOnly}>
            <ApiConnectionsManager />
          </ProtectedRoute>
        } />
        <Route path="users" element={
          <ProtectedRoute allowedRoles={adminOnly}>
            <UserManagement />
          </ProtectedRoute>
        } />
        <Route path="dev/rls" element={<RlsTroubleshooter />} />
        
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default ShopRoutes;
