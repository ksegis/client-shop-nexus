
import React from "react";
import { Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Customers from "@/pages/shop/Customers";
import Employees from "@/pages/shop/Employees";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

/**
 * Customer and employee management routes
 */
const CustomerRoutes = () => {
  return (
    <>
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
    </>
  );
};

export default CustomerRoutes;
