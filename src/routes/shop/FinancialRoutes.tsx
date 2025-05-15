
import React from "react";
import { Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Estimates from "@/pages/shop/Estimates";
import Invoices from "@/pages/shop/invoices";
import Reports from "@/pages/shop/Reports";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

/**
 * Financial routes - estimates, invoices, and reporting
 */
const FinancialRoutes = () => {
  return (
    <>
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
    </>
  );
};

export default FinancialRoutes;
