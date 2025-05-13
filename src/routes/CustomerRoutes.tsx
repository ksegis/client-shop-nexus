
import { Routes, Route } from "react-router-dom";
import CustomerLogin from "@/pages/customer/Login";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import CustomerProfile from "@/pages/customer/Profile";
import CustomerEstimates from "@/pages/customer/Estimates";
import CustomerEstimateDetail from "@/pages/customer/EstimateDetail";
import CustomerInvoices from "@/pages/customer/Invoices";
import CustomerTransactions from "@/pages/customer/Transactions";
import CustomerSettings from "@/pages/customer/Settings";
import NotFound from "@/pages/NotFound";

// Define which roles are allowed to access customer routes
const customerRoles = ['customer'];

const CustomerRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<CustomerLogin />} />
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
      
      {/* Catch any unknown routes within /customer/ */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default CustomerRoutes;
