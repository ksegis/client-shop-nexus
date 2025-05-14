
import { Routes, Route } from "react-router-dom";
import CustomerLogin from "@/pages/customer/Login";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import CustomerProfile from "@/pages/customer/Profile";
import CustomerEstimates from "@/pages/customer/Estimates";
import CustomerEstimateDetail from "@/pages/customer/EstimateDetail";
import CustomerInvoices from "@/pages/customer/Invoices";
import CustomerTransactions from "@/pages/customer/Transactions";
import CustomerSettings from "@/pages/customer/Settings";
import CustomerParts from "@/pages/customer/Parts";
import CustomerCheckout from "@/pages/customer/Checkout";
import CustomerServiceAppointments from "@/pages/customer/ServiceAppointments"; // Add this import
import NotFound from "@/pages/NotFound";
import { PartsCartProvider } from "@/contexts/parts/PartsCartContext";
import Layout from "@/components/layout/Layout";

// Define which roles are allowed to access customer routes
const customerRoles = ['customer'];

const CustomerRoutes = () => {
  return (
    <PartsCartProvider>
      <Routes>
        <Route path="login" element={<CustomerLogin />} />
        
        <Route element={<Layout portalType="customer" />}>
          <Route index element={
            <ProtectedRoute allowedRoles={customerRoles}>
              <CustomerProfile />
            </ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute allowedRoles={customerRoles}>
              <CustomerProfile />
            </ProtectedRoute>
          } />
          <Route path="estimates" element={
            <ProtectedRoute allowedRoles={customerRoles}>
              <CustomerEstimates />
            </ProtectedRoute>
          } />
          <Route path="estimates/:estimateId" element={
            <ProtectedRoute allowedRoles={customerRoles}>
              <CustomerEstimateDetail />
            </ProtectedRoute>
          } />
          <Route path="invoices" element={
            <ProtectedRoute allowedRoles={customerRoles}>
              <CustomerInvoices />
            </ProtectedRoute>
          } />
          <Route path="transactions" element={
            <ProtectedRoute allowedRoles={customerRoles}>
              <CustomerTransactions />
            </ProtectedRoute>
          } />
          <Route path="settings" element={
            <ProtectedRoute allowedRoles={customerRoles}>
              <CustomerSettings />
            </ProtectedRoute>
          } />
          <Route path="parts" element={
            <ProtectedRoute allowedRoles={customerRoles}>
              <CustomerParts />
            </ProtectedRoute>
          } />
          <Route path="checkout" element={
            <ProtectedRoute allowedRoles={customerRoles}>
              <CustomerCheckout />
            </ProtectedRoute>
          } />
          {/* Add new route for Service Appointments */}
          <Route path="service-appointments" element={
            <ProtectedRoute allowedRoles={customerRoles}>
              <CustomerServiceAppointments />
            </ProtectedRoute>
          } />
          
          {/* Catch any unknown routes within /customer/ */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </PartsCartProvider>
  );
};

export default CustomerRoutes;
