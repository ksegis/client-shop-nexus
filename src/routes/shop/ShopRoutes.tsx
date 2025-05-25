
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
import WorkOrders from "@/pages/shop/WorkOrders";
import WorkOrderDetailPage from "@/pages/shop/work-orders/WorkOrderDetailPage";
import UserManagement from "@/pages/shop/admin/UserManagement";
import NotFound from "@/pages/NotFound";
import Invoices from "@/pages/shop/invoices";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const ShopRoutes = () => {
  return (
    <Layout portalType="shop">
      <Routes>
        {/* Wrap all shop routes in ProtectedRoute */}
        <Route
          index
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Shop user profile */}
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        
        {/* Customer management */}
        <Route
          path="customers"
          element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          }
        />
        
        {/* Admin routes */}
        <Route
          path="admin/user-management"
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        
        {/* Document management */}
        <Route
          path="estimates"
          element={
            <ProtectedRoute>
              <Estimates />
            </ProtectedRoute>
          }
        />
        <Route
          path="work-orders"
          element={
            <ProtectedRoute>
              <WorkOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="work-orders/:id"
          element={
            <ProtectedRoute>
              <WorkOrderDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="invoices"
          element={
            <ProtectedRoute>
              <Invoices />
            </ProtectedRoute>
          }
        />
        
        {/* Reporting */}
        <Route
          path="reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        
        {/* Inventory management */}
        <Route
          path="parts"
          element={
            <ProtectedRoute>
              <Parts />
            </ProtectedRoute>
          }
        />
        <Route
          path="inventory"
          element={
            <ProtectedRoute>
              <Inventory />
            </ProtectedRoute>
          }
        />
        
        {/* Service management */}
        <Route
          path="service-desk"
          element={
            <ProtectedRoute>
              <ServiceDesk />
            </ProtectedRoute>
          }
        />
        <Route
          path="service-appointments"
          element={
            <ProtectedRoute>
              <ServiceAppointments />
            </ProtectedRoute>
          }
        />
        
        {/* Catch all undefined routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

export default ShopRoutes;
