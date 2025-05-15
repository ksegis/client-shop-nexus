
import React from "react";
import { Routes, Route } from "react-router-dom";
import ShopLogin from "@/pages/shop/Login";
import NotFound from "@/pages/NotFound";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/shop/Dashboard";
import Profile from "@/pages/shop/Profile";
import Customers from "@/pages/shop/Customers";
import Employees from "@/pages/shop/Employees";
import WorkOrders from "@/pages/shop/WorkOrders";
import WorkOrderDetailPage from "@/pages/shop/work-orders/WorkOrderDetailPage";
import Inventory from "@/pages/shop/Inventory";
import Parts from "@/pages/shop/Parts";
import SimpleInventory from "@/pages/shop/SimpleInventory";
import Estimates from "@/pages/shop/Estimates";
import Invoices from "@/pages/shop/invoices";
import Reports from "@/pages/shop/Reports";
import ServiceAppointments from "@/pages/shop/ServiceAppointments";
import ServiceDesk from "@/pages/shop/ServiceDesk";
import AdminPage from "@/pages/shop/admin/AdminPage";
import UserManagement from "@/pages/shop/admin/UserManagement";
import TestUsers from "@/pages/shop/admin/TestUsers";
import AuthLogs from "@/pages/shop/admin/AuthLogs";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

/**
 * Main shop routes component that contains all shop-related routes
 */
const ShopRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<ShopLogin />} />
      
      {/* Core dashboard routes */}
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
        path="profile" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'test_staff', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <Profile />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      {/* Customer management routes */}
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
        path="employees" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <Employees />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      {/* Work order routes */}
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
      
      {/* Inventory and parts routes */}
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
        path="simple-inventory" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'test_staff', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <SimpleInventory />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      {/* Financial routes */}
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
      
      {/* Service desk and appointments routes */}
      <Route 
        path="service-desk" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'test_staff', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <ServiceDesk />
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
      
      {/* Admin routes */}
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
      
      {/* Catch all unmatched routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default ShopRoutes;
