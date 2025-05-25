
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/customer/Dashboard";
import Profile from "@/pages/customer/Profile";
import Estimates from "@/pages/customer/Estimates";
import EstimateDetail from "@/pages/customer/EstimateDetail";
import Invoices from "@/pages/customer/Invoices";
import InvoiceDetail from "@/pages/customer/InvoiceDetail";
import WorkOrders from "@/pages/customer/WorkOrders";
import WorkOrderDetail from "@/pages/customer/WorkOrderDetail";
import Vehicles from "@/pages/customer/Vehicles";
import Parts from "@/pages/customer/Parts";
import Transactions from "@/pages/customer/Transactions";
import Messages from "@/pages/customer/Messages";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/auth";

// Component to redirect non-customers to shop portal
const CustomerPortalGuard = ({ children }: { children: React.ReactNode }) => {
  const { profile } = useAuth();
  
  // If user is admin or staff, redirect to shop portal
  if (profile && (profile.role === 'admin' || profile.role === 'staff')) {
    console.log('Admin/staff user trying to access customer portal, redirecting to shop');
    return <Navigate to="/shop/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const CustomerRoutes = () => {
  return (
    <CustomerPortalGuard>
      <Layout portalType="customer">
        <Routes>
          <Route
            index
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="estimates"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Estimates />
              </ProtectedRoute>
            }
          />
          <Route
            path="estimates/:id"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <EstimateDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="invoices"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Invoices />
              </ProtectedRoute>
            }
          />
          <Route
            path="invoices/:id"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <InvoiceDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="work-orders"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <WorkOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="work-orders/:id"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <WorkOrderDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="vehicles"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Vehicles />
              </ProtectedRoute>
            }
          />
          <Route
            path="parts"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Parts />
              </ProtectedRoute>
            }
          />
          <Route
            path="transactions"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Transactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="messages"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </CustomerPortalGuard>
  );
};

export default CustomerRoutes;
