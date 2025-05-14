import { Routes, Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/customer/Dashboard";
import Invoices from "@/pages/customer/Invoices";
import InvoiceDetail from "@/pages/customer/InvoiceDetail";
import Estimates from "@/pages/customer/Estimates";
import EstimateDetail from "@/pages/customer/EstimateDetail";
import WorkOrders from "@/pages/customer/WorkOrders";
import WorkOrderDetail from "@/pages/customer/WorkOrderDetail";
import Vehicles from "@/pages/customer/Vehicles";
import Parts from "@/pages/customer/Parts";
import Transactions from "@/pages/customer/Transactions";
import Messages from "@/pages/customer/Messages";
import Profile from "@/pages/customer/Profile";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const CustomerRoutes = () => {
  return (
    <Routes>
      <Route 
        path="" 
        element={
          <ProtectedRoute allowedRoles={['customer', 'test_customer']} requiredPortal="customer">
            <Layout portalType="customer">
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="profile" 
        element={
          <ProtectedRoute allowedRoles={['customer', 'test_customer']} requiredPortal="customer">
            <Layout portalType="customer">
              <Profile />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="vehicles" 
        element={
          <ProtectedRoute allowedRoles={['customer', 'test_customer']} requiredPortal="customer">
            <Layout portalType="customer">
              <Vehicles />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="invoices" 
        element={
          <ProtectedRoute allowedRoles={['customer', 'test_customer']} requiredPortal="customer">
            <Layout portalType="customer">
              <Invoices />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="invoices/:id" 
        element={
          <ProtectedRoute allowedRoles={['customer', 'test_customer']} requiredPortal="customer">
            <Layout portalType="customer">
              <InvoiceDetail />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="estimates" 
        element={
          <ProtectedRoute allowedRoles={['customer', 'test_customer']} requiredPortal="customer">
            <Layout portalType="customer">
              <Estimates />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="estimates/:id" 
        element={
          <ProtectedRoute allowedRoles={['customer', 'test_customer']} requiredPortal="customer">
            <Layout portalType="customer">
              <EstimateDetail />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="work-orders" 
        element={
          <ProtectedRoute allowedRoles={['customer', 'test_customer']} requiredPortal="customer">
            <Layout portalType="customer">
              <WorkOrders />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="work-orders/:id" 
        element={
          <ProtectedRoute allowedRoles={['customer', 'test_customer']} requiredPortal="customer">
            <Layout portalType="customer">
              <WorkOrderDetail />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="parts" 
        element={
          <ProtectedRoute allowedRoles={['customer', 'test_customer']} requiredPortal="customer">
            <Layout portalType="customer">
              <Parts />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="transactions" 
        element={
          <ProtectedRoute allowedRoles={['customer', 'test_customer']} requiredPortal="customer">
            <Layout portalType="customer">
              <Transactions />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="messages" 
        element={
          <ProtectedRoute allowedRoles={['customer', 'test_customer']} requiredPortal="customer">
            <Layout portalType="customer">
              <Messages />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default CustomerRoutes;
