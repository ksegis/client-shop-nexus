
import React from "react";
import { Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import AdminPage from "@/pages/shop/admin/AdminPage";
import UserManagement from "@/pages/shop/admin/UserManagement";
import TestUsers from "@/pages/shop/admin/TestUsers";
import AuthLogs from "@/pages/shop/admin/AuthLogs";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

/**
 * Admin-only routes for system management
 */
const AdminRoutes = () => {
  return (
    <>
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
    </>
  );
};

export default AdminRoutes;
