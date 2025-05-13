
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

const CustomerRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<CustomerLogin />} />
      <Route index element={
        <ProtectedRoute>
          <CustomerProfile />
        </ProtectedRoute>
      } />
      <Route path="profile" element={
        <ProtectedRoute>
          <CustomerProfile />
        </ProtectedRoute>
      } />
      <Route path="estimates" element={
        <ProtectedRoute>
          <CustomerEstimates />
        </ProtectedRoute>
      } />
      <Route path="estimates/:estimateId" element={
        <ProtectedRoute>
          <CustomerEstimateDetail />
        </ProtectedRoute>
      } />
      <Route path="invoices" element={
        <ProtectedRoute>
          <CustomerInvoices />
        </ProtectedRoute>
      } />
      <Route path="transactions" element={
        <ProtectedRoute>
          <CustomerTransactions />
        </ProtectedRoute>
      } />
      <Route path="settings" element={
        <ProtectedRoute>
          <CustomerSettings />
        </ProtectedRoute>
      } />
      
      {/* Catch any unknown routes within /customer/ */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default CustomerRoutes;
