
import { Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/shop/Dashboard";
import Parts from "@/pages/shop/Parts";
import SimpleInventory from "@/pages/shop/SimpleInventory";
import Inventory from "@/pages/shop/Inventory";
import Profile from "@/pages/shop/Profile";
import Employees from "@/pages/shop/Employees";
import Customers from "@/pages/shop/Customers";
import Estimates from "@/pages/shop/Estimates";
import ServiceDesk from "@/pages/shop/ServiceDesk";
import Invoices from "@/pages/shop/invoices";
import Reports from "@/pages/shop/Reports";
import AdminPage from "@/pages/shop/admin/AdminPage";
import RlsTroubleshooter from "@/components/dev/RlsTroubleshooter";
import NotFound from "@/pages/NotFound";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { PartsCartProvider } from "@/contexts/parts/PartsCartContext";
import Messages from "@/pages/shop/messages";
import WorkOrderDetailPage from "@/pages/shop/work-orders/WorkOrderDetailPage";

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
        <Route path="invoices" element={
          <ProtectedRoute allowedRoles={staffAndAdmin}>
            <Invoices />
          </ProtectedRoute>
        } />
        <Route path="messages" element={
          <ProtectedRoute allowedRoles={staffAndAdmin}>
            <Messages />
          </ProtectedRoute>
        } />
        <Route path="work-orders/:id" element={
          <ProtectedRoute allowedRoles={staffAndAdmin}>
            <WorkOrderDetailPage />
          </ProtectedRoute>
        } />
        <Route path="reports" element={
          <ProtectedRoute allowedRoles={staffAndAdmin}>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="admin/*" element={
          <ProtectedRoute allowedRoles={adminOnly}>
            <AdminPage />
          </ProtectedRoute>
        } />
        <Route path="dev/rls" element={<RlsTroubleshooter />} />
        
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default ShopRoutes;
