// Custom Truck Connections Shop Routes 
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/shop/Dashboard";
import Profile from "@/pages/shop/Profile";
import Customers from "@/pages/shop/Customers";
import VehicleManagement from "@/pages/shop/VehicleManagement";
import Estimates from "@/pages/shop/Estimates";
import Inventory from "@/pages/shop/Inventory";
import Parts from "@/pages/shop/Parts";
import Reports from "@/pages/shop/Reports";
import ServiceDesk from "@/pages/shop/ServiceDesk";
import ServiceAppointments from "@/pages/shop/ServiceAppointments";
import WorkOrders from "@/pages/shop/WorkOrders";
import NewWorkOrder from "@/pages/shop/work-orders/NewWorkOrder";
import WorkOrderDetailPage from "@/pages/shop/work-orders/WorkOrderDetailPage";
import { WorkOrdersProvider } from "@/pages/shop/work-orders/WorkOrdersContext";
import UserManagement from "@/pages/shop/admin/UserManagement";
import KeystoneConfig from "@/pages/shop/admin/KeystoneConfig";
import PricingManagement from "@/pages/shop/admin/PricingManagement.tsx";
import InventorySyncManagement from "@/pages/shop/admin/InventorySyncManagement";
import InventoryManagement from "@/pages/shop/admin/InventoryManagement";
import AdminSettings from "@/pages/shop/admin/AdminSettings";
import SystemSettings from "@/pages/shop/settings/SystemSettings";
import NotFound from "@/pages/NotFound";
import Invoices from "@/pages/shop/invoices";
import NewInvoice from "@/pages/shop/invoices/NewInvoice";
import NewInvoiceFromEstimate from "@/pages/shop/invoices/NewInvoiceFromEstimate";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { CustomersProvider } from "@/pages/shop/customers/CustomersContext";
import { CartProvider } from "@/lib/minimal_cart_context";


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

        {/* Vehicle management */}
        <Route
          path="vehicles"
          element={
            <ProtectedRoute>
              <CustomersProvider>
                <VehicleManagement />
              </CustomersProvider>
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
        <Route
          path="admin/keystone-config"
          element={
            <ProtectedRoute>
              <KeystoneConfig />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/pricing"
          element={
            <ProtectedRoute>
              <PricingManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/inventory-sync"
          element={
            <ProtectedRoute>
              <InventorySyncManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/inventory-management"
          element={
            <ProtectedRoute>
              <InventoryManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/settings"
          element={
            <ProtectedRoute>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
        
        {/* Settings routes */}
        <Route
          path="settings/system"
          element={
            <ProtectedRoute>
              <SystemSettings />
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
              <WorkOrdersProvider>
                <WorkOrders />
              </WorkOrdersProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="work-orders/new"
          element={
            <ProtectedRoute>
              <WorkOrdersProvider>
                <NewWorkOrder />
              </WorkOrdersProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="work-orders/:id"
          element={
            <ProtectedRoute>
              <WorkOrdersProvider>
                <WorkOrderDetailPage />
              </WorkOrdersProvider>
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
        <Route
          path="invoices/new"
          element={
            <ProtectedRoute>
              <NewInvoice />
            </ProtectedRoute>
          }
        />
        <Route
          path="invoices/new-from-estimate"
          element={
            <ProtectedRoute>
              <NewInvoiceFromEstimate />
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
              <CartProvider>
                <Parts />
              </CartProvider>
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

